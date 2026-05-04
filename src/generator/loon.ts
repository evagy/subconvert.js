import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { ProxyGroupConfig, ProxyGroupType } from '../config/proxygroup';
import { RulesetConfig } from '../config/ruleset';

export function proxyToLoon(
  proxies: Proxy[],
  proxyGroups: ProxyGroupConfig[],
  rulesets: RulesetConfig[],
  rulesetContent: Map<string, string>
): string {
  const lines: string[] = [];

  // General section
  lines.push('[General]');
  lines.push('skip-proxy = 127.0.0.1, 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, 100.64.0.0/10, localhost, *.local');
  lines.push('bypass-system = true');
  lines.push('dns-server = 1.1.1.1, 8.8.8.8');
  lines.push('');

  // Proxy section
  lines.push('[Proxy]');
  for (const proxy of proxies) {
    const line = proxyToLoonProxy(proxy);
    if (line) lines.push(line);
  }
  lines.push('DIRECT = direct');
  lines.push('');

  // Proxy Group section
  lines.push('[Proxy Group]');
  for (const group of proxyGroups) {
    const line = proxyGroupToLoon(group, proxies.map(p => p.remark));
    if (line) lines.push(line);
  }
  lines.push('');

  // Rule section
  lines.push('[Rule]');
  for (const rs of rulesets) {
    const content = rulesetContent.get(rs.url);
    if (content) {
      const rules = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
      for (const rule of rules) {
        lines.push(rule.trim());
      }
    }
  }
  lines.push('FINAL,DIRECT');

  return lines.join('\n');
}

function proxyToLoonProxy(proxy: Proxy): string {
  const name = proxy.remark;
  const server = proxy.hostname;
  const port = proxy.port;

  switch (proxy.type) {
    case ProxyType.Shadowsocks: {
      let line = `${name} = shadowsocks, ${server}, ${port}, ${proxy.encryptMethod}, "${proxy.password}"`;
      if (proxy.plugin) {
        line += `, plugin=${proxy.plugin}`;
        if (proxy.pluginOption) line += `, plugin-opts=${proxy.pluginOption}`;
      }
      if (proxy.udp === TriBool.True) line += ', udp=true';
      if (proxy.tcpFastOpen === TriBool.True) line += ', tfo=true';
      return line;
    }

    case ProxyType.ShadowsocksR: {
      let line = `${name} = shadowsocksR, ${server}, ${port}, ${proxy.encryptMethod}, "${proxy.password}"`;
      line += `, protocol=${proxy.protocol}`;
      if (proxy.protocolParam) line += `, protocol-param=${proxy.protocolParam}`;
      line += `, obfs=${proxy.obfs}`;
      if (proxy.obfsParam) line += `, obfs-param=${proxy.obfsParam}`;
      if (proxy.udp === TriBool.True) line += ', udp=true';
      if (proxy.tcpFastOpen === TriBool.True) line += ', tfo=true';
      return line;
    }

    case ProxyType.VMess: {
      let line = `${name} = vmess, ${server}, ${port}, ${proxy.encryptMethod}, "${proxy.userId}"`;
      if (proxy.alterId) line += `, alterId=${proxy.alterId}`;
      if (proxy.tlsSecure === TriBool.True) {
        line += ', tls=true';
        if (proxy.serverName) line += `, sni=${proxy.serverName}`;
      }
      if (proxy.transferProtocol && proxy.transferProtocol !== 'tcp') {
        line += `, transport=${proxy.transferProtocol}`;
        if (proxy.host) line += `, host=${proxy.host}`;
        if (proxy.path) line += `, path=${proxy.path}`;
      }
      if (proxy.udp === TriBool.True) line += ', udp=true';
      if (proxy.tcpFastOpen === TriBool.True) line += ', tfo=true';
      return line;
    }

    case ProxyType.Trojan: {
      let line = `${name} = trojan, ${server}, ${port}, "${proxy.password}"`;
      if (proxy.serverName) line += `, sni=${proxy.serverName}`;
      if (proxy.allowInsecure === TriBool.True) line += ', skip-cert-verify=true';
      if (proxy.udp === TriBool.True) line += ', udp=true';
      if (proxy.tcpFastOpen === TriBool.True) line += ', tfo=true';
      return line;
    }

    case ProxyType.HTTP:
    case ProxyType.HTTPS: {
      const type = proxy.type === ProxyType.HTTPS ? 'https' : 'http';
      let line = `${name} = ${type}, ${server}, ${port}`;
      if (proxy.username) line += `, ${proxy.username}`;
      if (proxy.password) line += `, "${proxy.password}"`;
      if (proxy.tlsSecure === TriBool.True) line += ', tls=true';
      return line;
    }

    case ProxyType.SOCKS5: {
      let line = `${name} = socks5, ${server}, ${port}`;
      if (proxy.username) line += `, ${proxy.username}`;
      if (proxy.password) line += `, "${proxy.password}"`;
      return line;
    }

    case ProxyType.Hysteria2: {
      let line = `${name} = hysteria2, ${server}, ${port}, "${proxy.password}"`;
      if (proxy.sni) line += `, sni=${proxy.sni}`;
      if (proxy.allowInsecure === TriBool.True) line += ', skip-cert-verify=true';
      if (proxy.upSpeed) line += `, upload=${proxy.upSpeed}`;
      if (proxy.downSpeed) line += `, download=${proxy.downSpeed}`;
      if (proxy.obfs) line += `, obfs=${proxy.obfs}`;
      if (proxy.obfsPassword) line += `, obfs-password=${proxy.obfsPassword}`;
      if (proxy.udp === TriBool.True) line += ', udp=true';
      return line;
    }

    default:
      return '';
  }
}

function proxyGroupToLoon(group: ProxyGroupConfig, proxyNames: string[]): string {
  const name = group.name;

  switch (group.type) {
    case ProxyGroupType.Select: {
      const proxies = filterProxiesForGroup(group.proxies, proxyNames);
      return `${name} = select, ${proxies.join(', ')}`;
    }

    case ProxyGroupType.URLTest: {
      const proxies = filterProxiesForGroup(group.proxies, proxyNames);
      const url = group.url || 'http://www.gstatic.com/generate_204';
      const interval = group.interval || 300;
      return `${name} = url-test, ${proxies.join(', ')}, ${url}, ${interval}`;
    }

    case ProxyGroupType.Fallback: {
      const proxies = filterProxiesForGroup(group.proxies, proxyNames);
      const url = group.url || 'http://www.gstatic.com/generate_204';
      const interval = group.interval || 300;
      return `${name} = fallback, ${proxies.join(', ')}, ${url}, ${interval}`;
    }

    case ProxyGroupType.LoadBalance: {
      const proxies = filterProxiesForGroup(group.proxies, proxyNames);
      return `${name} = load-balance, ${proxies.join(', ')}`;
    }

    default:
      return '';
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
