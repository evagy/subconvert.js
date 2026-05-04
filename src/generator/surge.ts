import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { ProxyGroupConfig, ProxyGroupType } from '../config/proxygroup';
import { RulesetConfig } from '../config/ruleset';

export function proxyToSurge(
  proxies: Proxy[],
  proxyGroups: ProxyGroupConfig[],
  rulesets: RulesetConfig[],
  rulesetContent: Map<string, string>,
  version = 3
): string {
  const lines: string[] = [];

  // General section
  lines.push('[General]');
  lines.push('loglevel = notify');
  lines.push('skip-proxy = 127.0.0.1, 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, 100.64.0.0/10, localhost, *.local');
  lines.push('external-controller-access = password@0.0.0.0:6170');
  lines.push('');

  // Proxy section
  lines.push('[Proxy]');
  for (const proxy of proxies) {
    const line = proxyToSurgeProxy(proxy, version);
    if (line) lines.push(line);
  }
  lines.push('DIRECT = direct');
  lines.push('');

  // Proxy Group section
  lines.push('[Proxy Group]');
  for (const group of proxyGroups) {
    const line = proxyGroupToSurge(group, proxies.map(p => p.remark));
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

function proxyToSurgeProxy(proxy: Proxy, version: number): string {
  const name = proxy.remark;
  const server = proxy.hostname;
  const port = proxy.port;

  switch (proxy.type) {
    case ProxyType.Shadowsocks: {
      let line = `${name} = ss, ${server}, ${port}, encrypt-method=${proxy.encryptMethod}, password=${proxy.password}`;
      if (proxy.plugin) {
        line += `, plugin=${proxy.plugin}`;
        if (proxy.pluginOption) line += `, plugin-opts=${proxy.pluginOption}`;
      }
      if (proxy.udp === TriBool.True) line += ', udp-relay=true';
      if (proxy.tcpFastOpen === TriBool.True) line += ', tfo=true';
      return line;
    }

    case ProxyType.VMess: {
      let line = `${name} = vmess, ${server}, ${port}, username=${proxy.userId}`;
      if (proxy.alterId) line += `, alterId=${proxy.alterId}`;
      if (proxy.encryptMethod) line += `, encrypt-method=${proxy.encryptMethod}`;
      if (proxy.tlsSecure === TriBool.True) {
        line += ', tls=true';
        if (proxy.serverName) line += `, sni=${proxy.serverName}`;
      }
      if (proxy.transferProtocol && proxy.transferProtocol !== 'tcp') {
        line += `, obfs=${proxy.transferProtocol}`;
        if (proxy.host) line += `, obfs-header="Host:${proxy.host}"`;
        if (proxy.path) line += `, obfs-path="${proxy.path}"`;
      }
      if (proxy.udp === TriBool.True) line += ', udp-relay=true';
      if (proxy.tcpFastOpen === TriBool.True) line += ', tfo=true';
      return line;
    }

    case ProxyType.Trojan: {
      let line = `${name} = trojan, ${server}, ${port}, password=${proxy.password}`;
      if (proxy.serverName) line += `, sni=${proxy.serverName}`;
      if (proxy.allowInsecure === TriBool.True) line += ', skip-cert-verify=true';
      if (proxy.udp === TriBool.True) line += ', udp-relay=true';
      if (proxy.tcpFastOpen === TriBool.True) line += ', tfo=true';
      return line;
    }

    case ProxyType.HTTP:
    case ProxyType.HTTPS: {
      const type = proxy.type === ProxyType.HTTPS ? 'https' : 'http';
      let line = `${name} = ${type}, ${server}, ${port}`;
      if (proxy.username) line += `, username=${proxy.username}`;
      if (proxy.password) line += `, password=${proxy.password}`;
      if (proxy.tlsSecure === TriBool.True) line += ', tls=true';
      return line;
    }

    case ProxyType.SOCKS5: {
      let line = `${name} = socks5, ${server}, ${port}`;
      if (proxy.username) line += `, username=${proxy.username}`;
      if (proxy.password) line += `, password=${proxy.password}`;
      return line;
    }

    default:
      return '';
  }
}

function proxyGroupToSurge(group: ProxyGroupConfig, proxyNames: string[]): string {
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
      return `${name} = url-test, ${proxies.join(', ')}, url=${url}, interval=${interval}`;
    }

    case ProxyGroupType.Fallback: {
      const proxies = filterProxiesForGroup(group.proxies, proxyNames);
      const url = group.url || 'http://www.gstatic.com/generate_204';
      const interval = group.interval || 300;
      return `${name} = fallback, ${proxies.join(', ')}, url=${url}, interval=${interval}`;
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
