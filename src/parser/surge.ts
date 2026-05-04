import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { getLines } from '../utils/common';

export function parseSurge(content: string): Proxy[] {
  const proxies: Proxy[] = [];
  const lines = getLines(content);

  let inProxySection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('#') || trimmed.startsWith(';')) continue;

    // Check for section headers
    if (trimmed.startsWith('[')) {
      const section = trimmed.slice(1, trimmed.indexOf(']')).trim().toLowerCase();
      inProxySection = section === 'proxy' || section === 'proxies';
      continue;
    }

    if (!inProxySection) continue;

    // Parse proxy line: name = type, server, port, params...
    const proxy = parseSurgeProxyLine(trimmed);
    if (proxy) proxies.push(proxy);
  }

  return proxies;
}

function parseSurgeProxyLine(line: string): Proxy | null {
  try {
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) return null;

    const name = line.slice(0, eqIndex).trim();
    const paramsStr = line.slice(eqIndex + 1).trim();
    const params = splitParams(paramsStr);

    if (params.length < 3) return null;

    const type = params[0].toLowerCase();
    const server = params[1];
    const port = parseInt(params[2], 10);

    let proxy: Proxy;

    switch (type) {
      case 'ss':
        proxy = new Proxy(ProxyType.Shadowsocks);
        proxy.encryptMethod = getParam(params, 'encrypt-method') || getParam(params, 'encrypt-method') || '';
        proxy.password = getParam(params, 'password') || '';
        const plugin = getParam(params, 'plugin');
        if (plugin) {
          proxy.plugin = plugin;
          proxy.pluginOption = getParam(params, 'plugin-opts') || '';
        }
        break;

      case 'custom':
        // Surge custom proxy (Shadowsocks-like)
        proxy = new Proxy(ProxyType.Shadowsocks);
        proxy.encryptMethod = getParam(params, 'encrypt-method') || '';
        proxy.password = getParam(params, 'password') || '';
        break;

      case 'vmess':
        proxy = new Proxy(ProxyType.VMess);
        proxy.userId = getParam(params, 'username') || '';
        proxy.alterId = parseInt(getParam(params, 'alterId') || '0', 10);
        proxy.encryptMethod = getParam(params, 'encrypt-method') || 'auto';
        proxy.tlsSecure = getParam(params, 'tls') === 'true' ? TriBool.True : TriBool.False;
        proxy.serverName = getParam(params, 'sni') || '';
        proxy.transferProtocol = getParam(params, 'obfs') || 'tcp';
        if (proxy.transferProtocol === 'ws') {
          proxy.host = getParam(params, 'obfs-header') || '';
          proxy.path = getParam(params, 'obfs-path') || '/';
        }
        break;

      case 'trojan':
        proxy = new Proxy(ProxyType.Trojan);
        proxy.password = getParam(params, 'password') || '';
        proxy.serverName = getParam(params, 'sni') || '';
        proxy.allowInsecure = getParam(params, 'skip-cert-verify') === 'true' ? TriBool.True : TriBool.False;
        break;

      case 'http':
      case 'https':
        proxy = new Proxy(type === 'https' ? ProxyType.HTTPS : ProxyType.HTTP);
        proxy.username = getParam(params, 'username') || '';
        proxy.password = getParam(params, 'password') || '';
        proxy.tlsSecure = type === 'https' || getParam(params, 'tls') === 'true' ? TriBool.True : TriBool.False;
        break;

      case 'socks5':
      case 'socks5-tls':
        proxy = new Proxy(ProxyType.SOCKS5);
        proxy.username = getParam(params, 'username') || '';
        proxy.password = getParam(params, 'password') || '';
        proxy.tlsSecure = type === 'socks5-tls' ? TriBool.True : TriBool.False;
        break;

      default:
        return null;
    }

    proxy.hostname = server;
    proxy.port = port;
    proxy.remark = name || `${server}:${port}`;

    // Common params
    const udp = getParam(params, 'udp-relay');
    if (udp) proxy.udp = udp === 'true' ? TriBool.True : TriBool.False;

    const tfo = getParam(params, 'tfo');
    if (tfo) proxy.tcpFastOpen = tfo === 'true' ? TriBool.True : TriBool.False;

    return proxy;
  } catch {
    return null;
  }
}

function splitParams(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inQuotes) {
      if (ch === quoteChar) {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inQuotes = true;
      quoteChar = ch;
    } else if (ch === ',') {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

function getParam(params: string[], name: string): string | undefined {
  for (let i = 3; i < params.length; i++) {
    const param = params[i];
    const eqIndex = param.indexOf('=');
    if (eqIndex !== -1) {
      const key = param.slice(0, eqIndex).trim().toLowerCase();
      if (key === name.toLowerCase()) {
        return param.slice(eqIndex + 1).trim();
      }
    }
  }
  return undefined;
}
