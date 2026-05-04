import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { base64Decode, base64UrlDecode } from '../utils/base64';
import { urlDecode } from '../utils/common';

export function parseVmess(link: string): Proxy | null {
  if (!link.startsWith('vmess://') && !link.startsWith('vmess1://')) return null;

  try {
    if (link.startsWith('vmess://')) {
      const content = link.slice(8);
      // Try v2rayN JSON format first
      if (content.startsWith('{') || (content.length > 10 && !content.includes('@'))) {
        return parseVmessV2rayN(content);
      }
      // Try standard SIP002-style format
      if (content.includes('@')) {
        return parseVmessStd(content);
      }
      // Try shadowrocket format
      return parseVmessShadowrocket(content);
    }

    // Kitsunebi format
    if (link.startsWith('vmess1://')) {
      return parseVmessKitsunebi(link);
    }

    return null;
  } catch {
    return null;
  }
}

function parseVmessV2rayN(content: string): Proxy | null {
  let jsonStr: string;
  try {
    jsonStr = base64Decode(content);
  } catch {
    jsonStr = content;
  }

  const data = JSON.parse(jsonStr);
  if (!data.add && !data.host && !data.ps) return null;

  const proxy = new Proxy(ProxyType.VMess);
  proxy.hostname = data.add || data.host || '';
  proxy.port = parseInt(data.port || data.tls_port || '443', 10);
  proxy.userId = data.id || '';
  proxy.alterId = parseInt(data.aid || data.alterId || '0', 10);
  proxy.remark = data.ps || `${proxy.hostname}:${proxy.port}`;

  // Transport
  proxy.transferProtocol = data.net || data.type || 'tcp';
  proxy.fakeType = data.type || 'none';

  // TLS
  proxy.tlsSecure = data.tls === 'tls' ? TriBool.True : TriBool.False;
  proxy.serverName = data.sni || data.host || '';

  // WebSocket / HTTP/2
  if (proxy.transferProtocol === 'ws' || proxy.transferProtocol === 'h2') {
    proxy.host = data.host || '';
    proxy.path = data.path || '';
  }

  // QUIC
  if (proxy.transferProtocol === 'quic') {
    proxy.quicSecure = data.quicSecurity || 'none';
    proxy.quicSecret = data.quicKey || '';
  }

  // gRPC
  if (proxy.transferProtocol === 'grpc') {
    proxy.path = data.path || data.serviceName || '';
  }

  return proxy;
}

function parseVmessStd(content: string): Proxy | null {
  // vmess://uuid@server:port?params#remark
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

  const userId = body.slice(0, atIndex);
  const serverPort = body.slice(atIndex + 1);
  const lastColon = serverPort.lastIndexOf(':');
  if (lastColon === -1) return null;

  const server = serverPort.slice(0, lastColon);
  const port = parseInt(serverPort.slice(lastColon + 1), 10);

  const proxy = new Proxy(ProxyType.VMess);
  proxy.hostname = server;
  proxy.port = port;
  proxy.userId = userId;
  proxy.remark = remark || `${server}:${port}`;
  proxy.transferProtocol = params['type'] || 'tcp';
  proxy.tlsSecure = params['security'] === 'tls' ? TriBool.True : TriBool.False;
  proxy.host = params['host'] || '';
  proxy.path = params['path'] || '';
  proxy.serverName = params['sni'] || '';
  proxy.alterId = parseInt(params['aid'] || '0', 10);

  return proxy;
}

function parseVmessShadowrocket(content: string): Proxy | null {
  // Shadowrocket format: vmess://base64(uuid@server:port?params)#remark
  const hashIndex = content.indexOf('#');
  let remark = '';
  let body = content;
  if (hashIndex !== -1) {
    remark = urlDecode(content.slice(hashIndex + 1));
    body = content.slice(0, hashIndex);
  }

  let decoded: string;
  try {
    decoded = base64Decode(body);
  } catch {
    return null;
  }

  const questionIndex = decoded.indexOf('?');
  let params: Record<string, string> = {};
  let mainPart = decoded;
  if (questionIndex !== -1) {
    const searchParams = new URLSearchParams(decoded.slice(questionIndex + 1));
    searchParams.forEach((v, k) => { params[k] = v; });
    mainPart = decoded.slice(0, questionIndex);
  }

  const atIndex = mainPart.indexOf('@');
  if (atIndex === -1) return null;

  const userId = mainPart.slice(0, atIndex);
  const serverPort = mainPart.slice(atIndex + 1);
  const lastColon = serverPort.lastIndexOf(':');
  if (lastColon === -1) return null;

  const server = serverPort.slice(0, lastColon);
  const port = parseInt(serverPort.slice(lastColon + 1), 10);

  const proxy = new Proxy(ProxyType.VMess);
  proxy.hostname = server;
  proxy.port = port;
  proxy.userId = userId;
  proxy.remark = remark || `${server}:${port}`;
  proxy.transferProtocol = params['type'] || 'tcp';
  proxy.tlsSecure = params['tls'] === '1' ? TriBool.True : TriBool.False;
  proxy.host = params['host'] || '';
  proxy.path = params['path'] || '';
  proxy.alterId = parseInt(params['aid'] || '0', 10);

  return proxy;
}

function parseVmessKitsunebi(link: string): Proxy | null {
  // vmess1://uuid@server:port?params#remark
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

  const userId = body.slice(0, atIndex);
  const serverPort = body.slice(atIndex + 1);
  const lastColon = serverPort.lastIndexOf(':');
  if (lastColon === -1) return null;

  const server = serverPort.slice(0, lastColon);
  const port = parseInt(serverPort.slice(lastColon + 1), 10);

  const proxy = new Proxy(ProxyType.VMess);
  proxy.hostname = server;
  proxy.port = port;
  proxy.userId = userId;
  proxy.remark = remark || `${server}:${port}`;
  proxy.transferProtocol = params['type'] || 'tcp';
  proxy.tlsSecure = params['tls'] === '1' ? TriBool.True : TriBool.False;
  proxy.host = params['host'] || '';
  proxy.path = params['path'] || '';
  proxy.alterId = parseInt(params['aid'] || '0', 10);

  return proxy;
}
