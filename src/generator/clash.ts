import * as yaml from 'js-yaml';
import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { ProxyGroupConfig, ProxyGroupType } from '../config/proxygroup';
import { RulesetConfig, RulesetType } from '../config/ruleset';
import { replaceAll } from '../utils/common';

interface ClashProxy {
  name: string;
  type: string;
  server: string;
  port: number;
  [key: string]: unknown;
}

interface ClashConfig {
  proxies: ClashProxy[];
  'proxy-groups': Record<string, unknown>[];
  rules: string[];
  [key: string]: unknown;
}

export function proxyToClash(
  proxies: Proxy[],
  proxyGroups: ProxyGroupConfig[],
  rulesets: RulesetConfig[],
  rulesetContent: Map<string, string>,
  extraSettings: {
    newFieldNames?: boolean;
    clashR?: boolean;
    classic?: boolean;
    script?: boolean;
  } = {}
): string {
  const clashProxies = proxies.map(p => proxyToClashProxy(p, extraSettings.newFieldNames));
  const groupNames = proxies.map(p => p.remark);

  // Build proxy groups
  const groups = buildClashProxyGroups(proxyGroups, groupNames, proxies);

  // Build rules
  const rules = buildClashRules(rulesets, rulesetContent, extraSettings.classic);

  const config: Record<string, unknown> = {
    'mixed-port': 7890,
    'allow-lan': true,
    'bind-address': '*',
    'mode': 'rule',
    'log-level': 'info',
    'external-controller': '127.0.0.1:9090',
    proxies: clashProxies,
    'proxy-groups': groups,
    rules,
  };

  return yaml.dump(config, { lineWidth: -1, noRefs: true });
}

function proxyToClashProxy(proxy: Proxy, newFieldNames = false): ClashProxy {
  const base: ClashProxy = {
    name: proxy.remark,
    type: getClashTypeName(proxy.type),
    server: proxy.hostname,
    port: proxy.port,
  };

  switch (proxy.type) {
    case ProxyType.Shadowsocks:
      base.cipher = proxy.encryptMethod;
      base.password = proxy.password;
      if (proxy.plugin) {
        base.plugin = proxy.plugin;
        base['plugin-opts'] = parsePluginOpts(proxy.pluginOption);
      }
      break;

    case ProxyType.ShadowsocksR:
      base.cipher = proxy.encryptMethod;
      base.password = proxy.password;
      base.protocol = proxy.protocol;
      base['protocol-param'] = proxy.protocolParam;
      base.obfs = proxy.obfs;
      base['obfs-param'] = proxy.obfsParam;
      break;

    case ProxyType.VMess:
      base.uuid = proxy.userId;
      base.alterId = proxy.alterId;
      base.cipher = proxy.encryptMethod || 'auto';
      if (proxy.tlsSecure === TriBool.True) {
        base.tls = true;
        if (proxy.serverName) base.servername = proxy.serverName;
      }
      base.network = proxy.transferProtocol;
      if (proxy.transferProtocol === 'ws') {
        const wsOpts: Record<string, unknown> = {};
        if (proxy.host || proxy.path) {
          if (proxy.host) wsOpts.headers = { Host: proxy.host };
          if (proxy.path) wsOpts.path = proxy.path;
        }
        base['ws-opts'] = wsOpts;
      } else if (proxy.transferProtocol === 'h2') {
        const h2Opts: Record<string, unknown> = {};
        if (proxy.host) h2Opts.host = [proxy.host];
        if (proxy.path) h2Opts.path = proxy.path;
        base['h2-opts'] = h2Opts;
      } else if (proxy.transferProtocol === 'grpc') {
        base['grpc-opts'] = { 'grpc-service-name': proxy.path };
      }
      break;

    case ProxyType.Trojan:
      base.password = proxy.password;
      if (proxy.serverName) base.sni = proxy.serverName;
      if (proxy.allowInsecure === TriBool.True) base['skip-cert-verify'] = true;
      base.network = proxy.transferProtocol;
      if (proxy.transferProtocol === 'ws') {
        const twsOpts: Record<string, unknown> = {};
        if (proxy.host) twsOpts.headers = { Host: proxy.host };
        if (proxy.path) twsOpts.path = proxy.path;
        base['ws-opts'] = twsOpts;
      }
      break;

    case ProxyType.HTTP:
    case ProxyType.HTTPS:
      base.type = 'http';
      if (proxy.username) base.username = proxy.username;
      if (proxy.password) base.password = proxy.password;
      base.tls = proxy.type === ProxyType.HTTPS || proxy.tlsSecure === TriBool.True;
      break;

    case ProxyType.SOCKS5:
      base.type = 'socks5';
      if (proxy.username) base.username = proxy.username;
      if (proxy.password) base.password = proxy.password;
      break;

    case ProxyType.WireGuard:
      base.ip = proxy.selfIP;
      base['private-key'] = proxy.privateKey;
      base['public-key'] = proxy.publicKey;
      if (proxy.preSharedKey) base['pre-shared-key'] = proxy.preSharedKey;
      base.dns = proxy.dnsServers;
      base.mtu = proxy.mtu;
      base['allowed-ips'] = proxy.allowedIPs;
      if (proxy.keepAlive) base.keepalive = proxy.keepAlive;
      break;

    case ProxyType.Hysteria2:
      base.password = proxy.password;
      if (proxy.upSpeed) base.up = proxy.upSpeed;
      if (proxy.downSpeed) base.down = proxy.downSpeed;
      if (proxy.sni) base.sni = proxy.sni;
      if (proxy.allowInsecure === TriBool.True) base['skip-cert-verify'] = true;
      if (proxy.alpn.length) base.alpn = proxy.alpn;
      if (proxy.obfs) {
        base.obfs = proxy.obfs;
        base['obfs-password'] = proxy.obfsPassword;
      }
      break;
  }

  // Common flags
  if (proxy.udp === TriBool.True) base.udp = true;
  if (proxy.tcpFastOpen === TriBool.True) base.tfo = true;

  return base;
}

function getClashTypeName(type: ProxyType): string {
  switch (type) {
    case ProxyType.Shadowsocks: return 'ss';
    case ProxyType.ShadowsocksR: return 'ssr';
    case ProxyType.VMess: return 'vmess';
    case ProxyType.Trojan: return 'trojan';
    case ProxyType.HTTP: return 'http';
    case ProxyType.HTTPS: return 'http';
    case ProxyType.SOCKS5: return 'socks5';
    case ProxyType.WireGuard: return 'wireguard';
    case ProxyType.Hysteria2: return 'hysteria2';
    default: return 'unknown';
  }
}

function parsePluginOpts(opts: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (!opts) return result;

  const parts = opts.split(';');
  for (const part of parts) {
    const eqIndex = part.indexOf('=');
    if (eqIndex !== -1) {
      const key = part.slice(0, eqIndex).trim();
      const value = part.slice(eqIndex + 1).trim();
      result[key] = value;
    }
  }

  return result;
}

function buildClashProxyGroups(
  groupConfigs: ProxyGroupConfig[],
  proxyNames: string[],
  proxies: Proxy[]
): Record<string, unknown>[] {
  const groups: Record<string, unknown>[] = [];

  for (const gc of groupConfigs) {
    const group: Record<string, unknown> = {
      name: gc.name,
      type: gc.type,
    };

    // Filter proxies for this group
    const filteredNames = filterProxyNames(gc.proxies, proxyNames, proxies);
    group.proxies = filteredNames.length > 0 ? filteredNames : ['DIRECT'];

    // URL test settings
    if (gc.type === ProxyGroupType.URLTest || gc.type === ProxyGroupType.Fallback) {
      group.url = gc.url || 'http://www.gstatic.com/generate_204';
      group.interval = gc.interval || 300;
      group.tolerance = gc.tolerance || 0;
    }

    if (gc.strategy) {
      group.strategy = gc.strategy;
    }

    groups.push(group);
  }

  return groups;
}

function filterProxyNames(patterns: string[], proxyNames: string[], proxies: Proxy[]): string[] {
  if (patterns.length === 0) return proxyNames;

  const result: string[] = [];

  for (const pattern of patterns) {
    if (pattern === 'DIRECT' || pattern === 'REJECT') {
      result.push(pattern);
      continue;
    }

    try {
      const regex = new RegExp(pattern, 'i');
      for (let i = 0; i < proxyNames.length; i++) {
        if (regex.test(proxyNames[i]) && !result.includes(proxyNames[i])) {
          result.push(proxyNames[i]);
        }
      }
    } catch {
      // If not a valid regex, try exact match
      if (proxyNames.includes(pattern) && !result.includes(pattern)) {
        result.push(pattern);
      }
    }
  }

  return result;
}

function buildClashRules(
  rulesets: RulesetConfig[],
  rulesetContent: Map<string, string>,
  classic = false
): string[] {
  const rules: string[] = [];

  for (const rs of rulesets) {
    const content = rulesetContent.get(rs.url);
    if (!content) continue;

    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    for (const line of lines) {
      const trimmed = line.trim();
      if (classic) {
        rules.push(trimmed);
      } else {
        // Convert to rule-provider format
        rules.push(trimmed);
      }
    }
  }

  // Add final match rule
  rules.push('MATCH,DIRECT');

  return rules;
}
