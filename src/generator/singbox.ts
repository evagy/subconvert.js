import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { ProxyGroupConfig, ProxyGroupType } from '../config/proxygroup';
import { RulesetConfig } from '../config/ruleset';

interface SingBoxOutbound {
  type: string;
  tag: string;
  server?: string;
  server_port?: number;
  [key: string]: unknown;
}

interface SingBoxConfig {
  outbounds: SingBoxOutbound[];
  route: {
    rules: Record<string, unknown>[];
    auto_detect_interface: boolean;
    final: string;
  };
}

export function proxyToSingBox(
  proxies: Proxy[],
  proxyGroups: ProxyGroupConfig[],
  rulesets: RulesetConfig[],
  rulesetContent: Map<string, string>
): string {
  const outbounds: SingBoxOutbound[] = [];

  // Add direct outbound
  outbounds.push({ type: 'direct', tag: 'DIRECT' });
  outbounds.push({ type: 'block', tag: 'REJECT' });

  // Convert proxies
  for (const proxy of proxies) {
    const outbound = proxyToSingBoxOutbound(proxy);
    if (outbound) outbounds.push(outbound);
  }

  // Add proxy groups
  for (const group of proxyGroups) {
    const outbound = proxyGroupToSingBox(group, proxies.map(p => p.remark));
    if (outbound) outbounds.push(outbound);
  }

  // Build rules
  const rules = buildSingBoxRules(rulesets, rulesetContent);

  const config: SingBoxConfig = {
    outbounds,
    route: {
      rules,
      auto_detect_interface: true,
      final: 'DIRECT',
    },
  };

  return JSON.stringify(config, null, 2);
}

function proxyToSingBoxOutbound(proxy: Proxy): SingBoxOutbound | null {
  const base: SingBoxOutbound = {
    type: '',
    tag: proxy.remark,
    server: proxy.hostname,
    server_port: proxy.port,
  };

  switch (proxy.type) {
    case ProxyType.Shadowsocks:
      base.type = 'shadowsocks';
      base.method = proxy.encryptMethod;
      base.password = proxy.password;
      if (proxy.plugin) {
        base.plugin = proxy.plugin;
        base.plugin_opts = proxy.pluginOption;
      }
      break;

    case ProxyType.ShadowsocksR:
      base.type = 'shadowsocksr';
      base.method = proxy.encryptMethod;
      base.password = proxy.password;
      base.protocol = proxy.protocol;
      base.protocol_param = proxy.protocolParam;
      base.obfs = proxy.obfs;
      base.obfs_param = proxy.obfsParam;
      break;

    case ProxyType.VMess:
      base.type = 'vmess';
      base.uuid = proxy.userId;
      base.alter_id = proxy.alterId;
      base.security = proxy.encryptMethod || 'auto';

      if (proxy.tlsSecure === TriBool.True) {
        base.tls = {
          enabled: true,
          server_name: proxy.serverName || proxy.hostname,
        };
      }

      if (proxy.transferProtocol && proxy.transferProtocol !== 'tcp') {
        const transport: Record<string, unknown> = {
          type: proxy.transferProtocol,
        };
        if (proxy.host) transport.host = proxy.host;
        if (proxy.path) transport.path = proxy.path;
        base.transport = transport;
      }
      break;

    case ProxyType.Trojan:
      base.type = 'trojan';
      base.password = proxy.password;

      base.tls = {
        enabled: true,
        server_name: proxy.serverName || proxy.hostname,
        insecure: proxy.allowInsecure === TriBool.True,
      };
      break;

    case ProxyType.Hysteria2:
      base.type = 'hysteria2';
      base.password = proxy.password;

      base.tls = {
        enabled: true,
        server_name: proxy.sni || proxy.hostname,
        insecure: proxy.allowInsecure === TriBool.True,
      };

      if (proxy.upSpeed) base.up_mbps = proxy.upSpeed;
      if (proxy.downSpeed) base.down_mbps = proxy.downSpeed;
      if (proxy.obfs) {
        base.obfs = {
          type: proxy.obfs,
          password: proxy.obfsPassword,
        };
      }
      break;

    case ProxyType.WireGuard:
      base.type = 'wireguard';
      base.private_key = proxy.privateKey;
      base.peer_public_key = proxy.publicKey;
      if (proxy.preSharedKey) base.pre_shared_key = proxy.preSharedKey;
      base.local_address = [`${proxy.selfIP}/32`];
      if (proxy.mtu) base.mtu = proxy.mtu;
      break;

    case ProxyType.HTTP:
    case ProxyType.HTTPS:
      base.type = 'http';
      if (proxy.username) base.username = proxy.username;
      if (proxy.password) base.password = proxy.password;
      if (proxy.tlsSecure === TriBool.True) {
        base.tls = {
          enabled: true,
          server_name: proxy.serverName || proxy.hostname,
        };
      }
      break;

    case ProxyType.SOCKS5:
      base.type = 'socks';
      base.version = '5';
      if (proxy.username) base.username = proxy.username;
      if (proxy.password) base.password = proxy.password;
      break;

    default:
      return null;
  }

  return base;
}

function proxyGroupToSingBox(group: ProxyGroupConfig, proxyNames: string[]): SingBoxOutbound | null {
  const tag = group.name;
  const filteredNames = filterProxiesForGroup(group.proxies, proxyNames);

  switch (group.type) {
    case ProxyGroupType.Select:
      return {
        type: 'selector',
        tag,
        outbounds: filteredNames.length > 0 ? filteredNames : ['DIRECT'],
      };

    case ProxyGroupType.URLTest:
      return {
        type: 'urltest',
        tag,
        outbounds: filteredNames.length > 0 ? filteredNames : ['DIRECT'],
        url: group.url || 'http://www.gstatic.com/generate_204',
        interval: `${group.interval || 300}s`,
      };

    default:
      return null;
  }
}

function filterProxiesForGroup(patterns: string[], proxyNames: string[]): string[] {
  if (patterns.length === 0) return [...proxyNames, 'DIRECT'];

  const result: string[] = [];

  for (const pattern of patterns) {
    if (pattern === 'DIRECT' || pattern === 'REJECT') {
      result.push(pattern);
      continue;
    }

    try {
      const regex = new RegExp(pattern, 'i');
      for (const name of proxyNames) {
        if (regex.test(name) && !result.includes(name)) {
          result.push(name);
        }
      }
    } catch {
      if (proxyNames.includes(pattern) && !result.includes(pattern)) {
        result.push(pattern);
      }
    }
  }

  if (result.length === 0) return [...proxyNames, 'DIRECT'];
  return result;
}

function buildSingBoxRules(
  rulesets: RulesetConfig[],
  rulesetContent: Map<string, string>
): Record<string, unknown>[] {
  const rules: Record<string, unknown>[] = [];

  for (const rs of rulesets) {
    const content = rulesetContent.get(rs.url);
    if (!content) continue;

    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    for (const line of lines) {
      const trimmed = line.trim();
      const parts = trimmed.split(',');
      if (parts.length < 2) continue;

      const ruleType = parts[0].trim().toLowerCase();
      const ruleValue = parts[1].trim();
      const ruleOutbound = parts.length > 2 ? parts[2].trim() : rs.group;

      const rule: Record<string, unknown> = { outbound: ruleOutbound };

      switch (ruleType) {
        case 'domain':
        case 'domain-suffix':
          if (!rule.domain_suffix) rule.domain_suffix = [];
          (rule.domain_suffix as string[]).push(ruleValue);
          break;
        case 'domain-keyword':
          if (!rule.domain_keyword) rule.domain_keyword = [];
          (rule.domain_keyword as string[]).push(ruleValue);
          break;
        case 'ip-cidr':
        case 'ip-cidr6':
          if (!rule.ip_cidr) rule.ip_cidr = [];
          (rule.ip_cidr as string[]).push(ruleValue);
          break;
        default:
          continue;
      }

      rules.push(rule);
    }
  }

  return rules;
}
