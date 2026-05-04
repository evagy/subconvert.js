import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { ProxyGroupConfig, ProxyGroupType } from '../config/proxygroup';
import { RulesetConfig } from '../config/ruleset';
import { base64Encode } from '../utils/base64';

export function proxyToQuanX(
  proxies: Proxy[],
  proxyGroups: ProxyGroupConfig[],
  rulesets: RulesetConfig[],
  rulesetContent: Map<string, string>,
  devId = ''
): string {
  const lines: string[] = [];

  // Server section
  for (const proxy of proxies) {
    const line = proxyToQuanXServer(proxy);
    if (line) lines.push(line);
  }
  lines.push('');

  // Policy section
  for (const group of proxyGroups) {
    const line = proxyGroupToQuanX(group, proxies.map(p => p.remark));
    if (line) lines.push(line);
  }
  lines.push('');

  // Rules section
  lines.push('[filter_remote]');
  for (const rs of rulesets) {
    const content = rulesetContent.get(rs.url);
    if (content) {
      const rules = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
      for (const rule of rules) {
        lines.push(rule.trim());
      }
    }
  }
  lines.push('');

  // General section
  lines.push('[general]');
  lines.push('resource-parser = https://raw.githubusercontent.com/KOP-XIAO/QuantumultX/master/Scripts/resource-parser.js');

  if (devId) {
    lines.push(`device_id = ${devId}`);
  }

  return lines.join('\n');
}

function proxyToQuanXServer(proxy: Proxy): string {
  const name = proxy.remark;
  const server = proxy.hostname;
  const port = proxy.port;

  switch (proxy.type) {
    case ProxyType.Shadowsocks: {
      let line = `shadowsocks = ${server}:${port}, method=${proxy.encryptMethod}, password=${proxy.password}`;
      if (proxy.plugin) {
        line += `, obfs=${proxy.plugin}`;
        if (proxy.pluginOption) {
          const opts = parseObfsOptions(proxy.pluginOption);
          if (opts.host) line += `, obfs-host=${opts.host}`;
        }
      }
      if (proxy.udp === TriBool.True) line += ', udp-relay=true';
      if (proxy.tcpFastOpen === TriBool.True) line += ', fast-open=true';
      line += `, tag=${name}`;
      return line;
    }

    case ProxyType.VMess: {
      let line = `vmess = ${server}:${port}, method=auto, password=${proxy.userId}`;
      if (proxy.tlsSecure === TriBool.True) {
        line += ', over-tls=true';
        if (proxy.serverName) line += `, tls-host=${proxy.serverName}`;
      }
      if (proxy.transferProtocol && proxy.transferProtocol !== 'tcp') {
        line += `, obfs=${proxy.transferProtocol}`;
        if (proxy.host) line += `, obfs-host=${proxy.host}`;
        if (proxy.path) line += `, obfs-uri=${proxy.path}`;
      }
      if (proxy.udp === TriBool.True) line += ', udp-relay=true';
      if (proxy.tcpFastOpen === TriBool.True) line += ', fast-open=true';
      line += `, tag=${name}`;
      return line;
    }

    case ProxyType.Trojan: {
      let line = `trojan = ${server}:${port}, password=${proxy.password}`;
      if (proxy.serverName) line += `, sni=${proxy.serverName}`;
      if (proxy.allowInsecure === TriBool.True) line += ', skip-cert-verify=true';
      if (proxy.udp === TriBool.True) line += ', udp-relay=true';
      if (proxy.tcpFastOpen === TriBool.True) line += ', fast-open=true';
      line += `, tag=${name}`;
      return line;
    }

    case ProxyType.HTTP:
    case ProxyType.HTTPS: {
      const type = proxy.type === ProxyType.HTTPS ? 'https' : 'http';
      let line = `${type} = ${server}:${port}`;
      if (proxy.username) line += `, username=${proxy.username}`;
      if (proxy.password) line += `, password=${proxy.password}`;
      if (proxy.tlsSecure === TriBool.True) line += ', over-tls=true';
      line += `, tag=${name}`;
      return line;
    }

    case ProxyType.SOCKS5: {
      let line = `socks5 = ${server}:${port}`;
      if (proxy.username) line += `, username=${proxy.username}`;
      if (proxy.password) line += `, password=${proxy.password}`;
      line += `, tag=${name}`;
      return line;
    }

    default:
      return '';
  }
}

function proxyGroupToQuanX(group: ProxyGroupConfig, proxyNames: string[]): string {
  const name = group.name;

  switch (group.type) {
    case ProxyGroupType.Select: {
      const proxies = filterProxiesForGroup(group.proxies, proxyNames);
      return `shadowsocks = ${proxies.join(', ')}, tag=${name}`;
    }

    case ProxyGroupType.URLTest: {
      const proxies = filterProxiesForGroup(group.proxies, proxyNames);
      const url = group.url || 'http://www.gstatic.com/generate_204';
      const interval = group.interval || 300;
      return `shadowsocks = ${proxies.join(', ')}, tag=${name}, url=${url}, interval=${interval}`;
    }

    case ProxyGroupType.Fallback: {
      const proxies = filterProxiesForGroup(group.proxies, proxyNames);
      const url = group.url || 'http://www.gstatic.com/generate_204';
      const interval = group.interval || 300;
      return `shadowsocks = ${proxies.join(', ')}, tag=${name}, url=${url}, interval=${interval}`;
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

function parseObfsOptions(opts: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!opts) return result;

  const parts = opts.split(';');
  for (const part of parts) {
    const eqIndex = part.indexOf('=');
    if (eqIndex !== -1) {
      result[part.slice(0, eqIndex).trim()] = part.slice(eqIndex + 1).trim();
    }
  }

  return result;
}
