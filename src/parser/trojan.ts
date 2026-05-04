import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { urlDecode } from '../utils/common';

export function parseTrojan(link: string): Proxy | null {
  // trojan://password@server:port?params#remark
  try {
    if (!link.startsWith('trojan://')) return null;
    const content = link.slice(9);

    const hashIndex = content.indexOf('#');
    let remark = '';
    let body = content;
    if (hashIndex !== -1) {
      remark = urlDecode(content.slice(hashIndex + 1));
      body = content.slice(0, hashIndex);
    }

    const questionIndex = body.indexOf('?');
    let params: Record<string, string> = {};
    if (questionIndex !== -1) {
      const searchParams = new URLSearchParams(body.slice(questionIndex + 1));
      searchParams.forEach((v, k) => { params[k] = v; });
      body = body.slice(0, questionIndex);
    }

    const atIndex = body.indexOf('@');
    if (atIndex === -1) return null;

    const password = body.slice(0, atIndex);
    const serverPort = body.slice(atIndex + 1);
    const lastColon = serverPort.lastIndexOf(':');
    if (lastColon === -1) return null;

    let server = serverPort.slice(0, lastColon);
    let port = parseInt(serverPort.slice(lastColon + 1), 10);

    // Handle IPv6
    if (server.startsWith('[') && server.endsWith(']')) {
      server = server.slice(1, -1);
    }

    const proxy = new Proxy(ProxyType.Trojan);
    proxy.hostname = server;
    proxy.port = port;
    proxy.password = password;
    proxy.remark = remark || `${server}:${port}`;

    // TLS settings
    proxy.allowInsecure = params['allowInsecure'] === '1' || params['skip-cert-verify'] === 'true'
      ? TriBool.True : TriBool.False;
    proxy.serverName = params['sni'] || params['peer'] || '';
    proxy.tls13 = params['tls13'] === '1' ? TriBool.True : TriBool.Unset;

    // Transport
    proxy.transferProtocol = params['type'] || 'tcp';
    if (proxy.transferProtocol === 'ws') {
      proxy.host = params['host'] || '';
      proxy.path = params['path'] || '/';
    }

    // Network settings
    proxy.udp = params['udp'] === '1' ? TriBool.True : TriBool.Unset;
    proxy.tcpFastOpen = params['tfo'] === '1' ? TriBool.True : TriBool.Unset;

    return proxy;
  } catch {
    return null;
  }
}
