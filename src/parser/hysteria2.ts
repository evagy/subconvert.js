import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { urlDecode } from '../utils/common';

export function parseHysteria2(link: string): Proxy | null {
  // hy2://password@server:port?params#remark
  // or hysteria2://...
  try {
    let content: string;
    if (link.startsWith('hy2://')) {
      content = link.slice(6);
    } else if (link.startsWith('hysteria2://')) {
      content = link.slice(12);
    } else {
      return null;
    }

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

    const proxy = new Proxy(ProxyType.Hysteria2);
    proxy.hostname = server;
    proxy.port = port;
    proxy.password = password;
    proxy.remark = remark || `${server}:${port}`;

    // TLS
    proxy.allowInsecure = params['insecure'] === '1' || params['skip-cert-verify'] === 'true'
      ? TriBool.True : TriBool.False;
    proxy.sni = params['sni'] || '';
    proxy.fingerprint = params['fingerprint'] || '';
    proxy.ca = params['ca'] || params['ca-str'] || '';

    if (params['alpn']) {
      proxy.alpn = params['alpn'].split(',').map(s => s.trim());
    }

    // OBFS
    if (params['obfs']) {
      proxy.obfs = params['obfs'];
      proxy.obfsPassword = params['obfs-password'] || '';
    }

    // Bandwidth
    if (params['up']) {
      proxy.upSpeed = parseInt(params['up'], 10) || 0;
    }
    if (params['down']) {
      proxy.downSpeed = parseInt(params['down'], 10) || 0;
    }

    // Other
    proxy.udp = params['udp'] === '1' ? TriBool.True : TriBool.Unset;
    proxy.cwnd = parseInt(params['cwnd'] || '0', 10);

    return proxy;
  } catch {
    return null;
  }
}
