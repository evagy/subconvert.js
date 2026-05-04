import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { base64Encode, base64UrlEncode } from '../utils/base64';
import { urlEncode } from '../utils/common';

export function proxyToSSLink(proxy: Proxy): string {
  // SIP002 format: ss://base64(method:password)@server:port#remark
  const userInfo = `${proxy.encryptMethod}:${proxy.password}`;
  const encoded = base64Encode(userInfo);
  let link = `ss://${encoded}@${proxy.hostname}:${proxy.port}`;

  if (proxy.plugin) {
    const pluginOpts = proxy.pluginOption
      ? `${proxy.plugin};${proxy.pluginOption}`
      : proxy.plugin;
    link += `?plugin=${urlEncode(pluginOpts)}`;
  }

  link += `#${urlEncode(proxy.remark)}`;
  return link;
}

export function proxyToSSRLink(proxy: Proxy): string {
  // SSR format: ssr://base64(server:port:protocol:method:obfs:base64(password)/?params)
  const passwordB64 = base64Encode(proxy.password);
  const mainPart = `${proxy.hostname}:${proxy.port}:${proxy.protocol}:${proxy.encryptMethod}:${proxy.obfs}:${passwordB64}`;

  const params = new URLSearchParams();
  if (proxy.remark) params.set('remarks', base64Encode(proxy.remark));
  if (proxy.obfsParam) params.set('obfsparam', base64Encode(proxy.obfsParam));
  if (proxy.protocolParam) params.set('protoparam', base64Encode(proxy.protocolParam));
  if (proxy.group) params.set('group', base64Encode(proxy.group));

  const paramStr = params.toString();
  const full = paramStr ? `${mainPart}/?${paramStr}` : mainPart;
  return `ssr://${base64Encode(full)}`;
}

export function proxyToVmessLink(proxy: Proxy): string {
  // v2rayN JSON format
  const data = {
    v: '2',
    ps: proxy.remark,
    add: proxy.hostname,
    port: proxy.port,
    id: proxy.userId,
    aid: proxy.alterId,
    net: proxy.transferProtocol,
    type: proxy.fakeType,
    host: proxy.host,
    path: proxy.path,
    tls: proxy.tlsSecure === TriBool.True ? 'tls' : '',
    sni: proxy.serverName || '',
  };

  return `vmess://${base64Encode(JSON.stringify(data))}`;
}

export function proxyToTrojanLink(proxy: Proxy): string {
  // trojan://password@server:port?params#remark
  let link = `trojan://${urlEncode(proxy.password)}@${proxy.hostname}:${proxy.port}`;

  const params = new URLSearchParams();
  if (proxy.serverName) params.set('sni', proxy.serverName);
  if (proxy.allowInsecure === TriBool.True) params.set('allowInsecure', '1');
  if (proxy.transferProtocol !== 'tcp') params.set('type', proxy.transferProtocol);
  if (proxy.host) params.set('host', proxy.host);
  if (proxy.path) params.set('path', proxy.path);
  if (proxy.udp === TriBool.True) params.set('udp', '1');
  if (proxy.tcpFastOpen === TriBool.True) params.set('tfo', '1');

  const paramStr = params.toString();
  if (paramStr) link += `?${paramStr}`;
  link += `#${urlEncode(proxy.remark)}`;

  return link;
}

export function proxyToHysteria2Link(proxy: Proxy): string {
  // hy2://password@server:port?params#remark
  let link = `hy2://${urlEncode(proxy.password)}@${proxy.hostname}:${proxy.port}`;

  const params = new URLSearchParams();
  if (proxy.sni) params.set('sni', proxy.sni);
  if (proxy.allowInsecure === TriBool.True) params.set('insecure', '1');
  if (proxy.fingerprint) params.set('fingerprint', proxy.fingerprint);
  if (proxy.obfs) params.set('obfs', proxy.obfs);
  if (proxy.obfsPassword) params.set('obfs-password', proxy.obfsPassword);
  if (proxy.upSpeed) params.set('up', String(proxy.upSpeed));
  if (proxy.downSpeed) params.set('down', String(proxy.downSpeed));
  if (proxy.alpn.length) params.set('alpn', proxy.alpn.join(','));
  if (proxy.udp === TriBool.True) params.set('udp', '1');
  if (proxy.cwnd) params.set('cwnd', String(proxy.cwnd));

  const paramStr = params.toString();
  if (paramStr) link += `?${paramStr}`;
  link += `#${urlEncode(proxy.remark)}`;

  return link;
}

export function proxyToSingleLink(proxy: Proxy): string {
  switch (proxy.type) {
    case ProxyType.Shadowsocks:
      return proxyToSSLink(proxy);
    case ProxyType.ShadowsocksR:
      return proxyToSSRLink(proxy);
    case ProxyType.VMess:
      return proxyToVmessLink(proxy);
    case ProxyType.Trojan:
      return proxyToTrojanLink(proxy);
    case ProxyType.Hysteria2:
      return proxyToHysteria2Link(proxy);
    default:
      return '';
  }
}

export function proxyListToMixed(proxies: Proxy[]): string {
  return proxies
    .map(p => proxyToSingleLink(p))
    .filter(Boolean)
    .join('\n');
}

export function proxyListToBase64(proxies: Proxy[]): string {
  const links = proxyListToMixed(proxies);
  return base64Encode(links);
}
