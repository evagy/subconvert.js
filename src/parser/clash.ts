import * as yaml from 'js-yaml';
import { Proxy, ProxyType, TriBool } from '../config/proxy';

export function parseClash(content: string): Proxy[] {
  const proxies: Proxy[] = [];

  try {
    const config = yaml.load(content) as Record<string, unknown>;
    if (!config || typeof config !== 'object') return proxies;

    const proxyList = config['proxies'] as Record<string, unknown>[] | undefined;
    if (!Array.isArray(proxyList)) return proxies;

    for (const item of proxyList) {
      const proxy = parseClashProxy(item);
      if (proxy) proxies.push(proxy);
    }
  } catch {
    // Parse error
  }

  return proxies;
}

function parseClashProxy(item: Record<string, unknown>): Proxy | null {
  try {
    const type = String(item['type'] || '').toLowerCase();
    const name = String(item['name'] || '');
    const server = String(item['server'] || '');
    const port = Number(item['port'] || 0);

    if (!server || !port) return null;

    let proxy: Proxy;

    switch (type) {
      case 'ss':
      case 'shadowsocks':
        proxy = new Proxy(ProxyType.Shadowsocks);
        proxy.encryptMethod = String(item['cipher'] || '');
        proxy.password = String(item['password'] || '');
        if (item['plugin']) {
          proxy.plugin = String(item['plugin']);
          proxy.pluginOption = String(item['plugin-opts'] || item['pluginopts'] || '');
        }
        break;

      case 'ssr':
      case 'shadowsocksr':
        proxy = new Proxy(ProxyType.ShadowsocksR);
        proxy.encryptMethod = String(item['cipher'] || '');
        proxy.password = String(item['password'] || '');
        proxy.protocol = String(item['protocol'] || '');
        proxy.protocolParam = String(item['protocol-param'] || item['protocolparam'] || '');
        proxy.obfs = String(item['obfs'] || '');
        proxy.obfsParam = String(item['obfs-param'] || item['obfsparam'] || '');
        break;

      case 'vmess':
        proxy = new Proxy(ProxyType.VMess);
        proxy.userId = String(item['uuid'] || '');
        proxy.alterId = Number(item['alterId'] || item['alterid'] || 0);
        proxy.encryptMethod = String(item['cipher'] || 'auto');
        proxy.tlsSecure = item['tls'] ? TriBool.True : TriBool.False;
        proxy.serverName = String(item['servername'] || item['sni'] || '');

        const network = String(item['network'] || 'tcp');
        proxy.transferProtocol = network;

        if (network === 'ws') {
          const wsOpts = (item['ws-opts'] || item['wsOpts'] || {}) as Record<string, unknown>;
          proxy.host = String(wsOpts['headers'] && (wsOpts['headers'] as Record<string, unknown>)['Host'] || item['host'] || '');
          proxy.path = String(wsOpts['path'] || item['path'] || '/');
        } else if (network === 'h2') {
          const h2Opts = (item['h2-opts'] || item['h2Opts'] || {}) as Record<string, unknown>;
          proxy.host = String(h2Opts['host'] || item['host'] || '');
          proxy.path = String(h2Opts['path'] || item['path'] || '/');
        } else if (network === 'grpc') {
          const grpcOpts = (item['grpc-opts'] || item['grpcOpts'] || {}) as Record<string, unknown>;
          proxy.path = String(grpcOpts['grpc-service-name'] || item['serviceName'] || '');
        }
        break;

      case 'trojan':
        proxy = new Proxy(ProxyType.Trojan);
        proxy.password = String(item['password'] || '');
        proxy.serverName = String(item['sni'] || '');
        proxy.allowInsecure = item['skip-cert-verify'] ? TriBool.True : TriBool.False;

        const trojanNetwork = String(item['network'] || 'tcp');
        proxy.transferProtocol = trojanNetwork;
        if (trojanNetwork === 'ws') {
          const twsOpts = (item['ws-opts'] || {}) as Record<string, unknown>;
          proxy.host = String(twsOpts['headers'] && (twsOpts['headers'] as Record<string, unknown>)['Host'] || '');
          proxy.path = String(twsOpts['path'] || '/');
        }
        break;

      case 'http':
        proxy = new Proxy(ProxyType.HTTP);
        proxy.username = String(item['username'] || '');
        proxy.password = String(item['password'] || '');
        proxy.tlsSecure = item['tls'] ? TriBool.True : TriBool.False;
        break;

      case 'socks5':
      case 'socks':
        proxy = new Proxy(ProxyType.SOCKS5);
        proxy.username = String(item['username'] || '');
        proxy.password = String(item['password'] || '');
        break;

      case 'wireguard':
        proxy = new Proxy(ProxyType.WireGuard);
        proxy.selfIP = String(item['ip'] || '');
        proxy.privateKey = String(item['private-key'] || '');
        proxy.publicKey = String(item['public-key'] || '');
        proxy.preSharedKey = String(item['pre-shared-key'] || '');
        proxy.dnsServers = Array.isArray(item['dns']) ? item['dns'] as string[] : [];
        proxy.mtu = Number(item['mtu'] || 1420);
        proxy.keepAlive = Number(item['keepalive'] || 0);
        proxy.allowedIPs = Array.isArray(item['allowed-ips']) ? item['allowed-ips'] as string[] : [];
        break;

      case 'hysteria2':
        proxy = new Proxy(ProxyType.Hysteria2);
        proxy.password = String(item['password'] || '');
        proxy.upSpeed = Number(item['up'] || 0);
        proxy.downSpeed = Number(item['down'] || 0);
        proxy.allowInsecure = item['skip-cert-verify'] ? TriBool.True : TriBool.False;
        proxy.sni = String(item['sni'] || '');
        if (item['alpn']) {
          proxy.alpn = Array.isArray(item['alpn']) ? item['alpn'] as string[] : [String(item['alpn'])];
        }
        if (item['obfs']) {
          proxy.obfs = String(item['obfs']);
          const obfsOpts = (item['obfs-password'] || item['obfs-password'] || '') as string;
          proxy.obfsPassword = obfsOpts;
        }
        break;

      default:
        return null;
    }

    proxy.hostname = server;
    proxy.port = port;
    proxy.remark = name || `${server}:${port}`;

    // Common flags
    if (item['udp'] !== undefined) {
      proxy.udp = item['udp'] ? TriBool.True : TriBool.False;
    }
    if (item['tfo'] !== undefined) {
      proxy.tcpFastOpen = item['tfo'] ? TriBool.True : TriBool.False;
    }

    return proxy;
  } catch {
    return null;
  }
}
