import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { getLines, urlDecode } from '../utils/common';

export function parseQuan(content: string): Proxy[] {
  const proxies: Proxy[] = [];
  const lines = getLines(content);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;

    // Quantumult format: type=server, server=xxx, port=xxx, ...
    // or shorthand: shadowsocks=server:port:method:password:...
    const proxy = parseQuanLine(trimmed);
    if (proxy) proxies.push(proxy);
  }

  return proxies;
}

function parseQuanLine(line: string): Proxy | null {
  try {
    // Check for key=value format
    if (line.includes('=')) {
      return parseQuanKeyValue(line);
    }

    // Check for shorthand format
    const parts = line.split(',');
    if (parts.length < 2) return null;

    return parseQuanShorthand(parts);
  } catch {
    return null;
  }
}

function parseQuanKeyValue(line: string): Proxy | null {
  const pairs = line.split(',').map(p => p.trim());
  const params: Record<string, string> = {};

  for (const pair of pairs) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex !== -1) {
      const key = pair.slice(0, eqIndex).trim().toLowerCase();
      const value = pair.slice(eqIndex + 1).trim();
      params[key] = value;
    }
  }

  const type = params['type'] || '';
  const server = params['server'] || '';
  const port = parseInt(params['port'] || '0', 10);

  if (!server || !port) return null;

  let proxy: Proxy;

  switch (type.toLowerCase()) {
    case 'shadowsocks':
    case 'ss':
      proxy = new Proxy(ProxyType.Shadowsocks);
      proxy.encryptMethod = params['method'] || params['encrypt-method'] || '';
      proxy.password = params['password'] || '';
      if (params['obfs']) {
        proxy.plugin = params['obfs'];
        proxy.pluginOption = `obfs=${params['obfs']};obfs-host=${params['obfs-host'] || ''}`;
      }
      break;

    case 'vmess':
      proxy = new Proxy(ProxyType.VMess);
      proxy.userId = params['uuid'] || '';
      proxy.alterId = parseInt(params['alterid'] || '0', 10);
      proxy.encryptMethod = params['method'] || 'auto';
      proxy.tlsSecure = params['over-tls'] === 'true' ? TriBool.True : TriBool.False;
      proxy.transferProtocol = params['transport'] || 'tcp';
      proxy.host = params['host'] || '';
      proxy.path = params['path'] || '';
      break;

    case 'trojan':
      proxy = new Proxy(ProxyType.Trojan);
      proxy.password = params['password'] || '';
      proxy.serverName = params['sni'] || '';
      proxy.allowInsecure = params['skip-cert-verify'] === 'true' ? TriBool.True : TriBool.False;
      break;

    case 'http':
    case 'https':
      proxy = new Proxy(type.toLowerCase() === 'https' ? ProxyType.HTTPS : ProxyType.HTTP);
      proxy.username = params['username'] || '';
      proxy.password = params['password'] || '';
      break;

    default:
      return null;
  }

  proxy.hostname = server;
  proxy.port = port;
  proxy.remark = params['tag'] || `${server}:${port}`;

  return proxy;
}

function parseQuanShorthand(parts: string[]): Proxy | null {
  // Quantumult shorthand: server:port:method:password:...
  if (parts.length < 4) return null;

  const server = parts[0];
  const port = parseInt(parts[1], 10);
  const method = parts[2];
  const password = parts[3];

  if (!server || !port || !method || !password) return null;

  const proxy = new Proxy(ProxyType.Shadowsocks);
  proxy.hostname = server;
  proxy.port = port;
  proxy.encryptMethod = method;
  proxy.password = password;

  // Optional params
  if (parts.length > 4) {
    const obfs = parts[4];
    if (obfs && obfs !== 'none') {
      proxy.plugin = obfs;
      proxy.pluginOption = `obfs=${obfs}`;
      if (parts.length > 5) {
        proxy.pluginOption += `;obfs-host=${parts[5]}`;
      }
    }
  }

  proxy.remark = `${server}:${port}`;
  return proxy;
}
