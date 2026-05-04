import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { base64Decode } from '../utils/base64';
import { urlDecode } from '../utils/common';

export function parseSSR(link: string): Proxy | null {
  // SSR format: ssr://base64(server:port:protocol:method:obfs:base64(password)/?params)
  try {
    if (!link.startsWith('ssr://')) return null;
    const encoded = link.slice(6);
    const decoded = base64Decode(encoded);

    const slashIndex = decoded.indexOf('/?');
    let mainPart: string;
    let params = '';

    if (slashIndex !== -1) {
      mainPart = decoded.slice(0, slashIndex);
      params = decoded.slice(slashIndex + 2);
    } else {
      mainPart = decoded;
    }

    const parts = mainPart.split(':');
    if (parts.length < 6) return null;

    const server = parts[0];
    const port = parseInt(parts[1], 10);
    const protocol = parts[2];
    const method = parts[3];
    const obfs = parts[4];
    const passwordBase64 = parts[5];

    let password = '';
    try {
      password = base64Decode(passwordBase64);
    } catch {
      password = passwordBase64;
    }

    // Parse params
    let remark = '';
    let obfsParam = '';
    let protocolParam = '';
    let group = '';

    if (params) {
      const searchParams = new URLSearchParams(params);
      remark = searchParams.get('remarks') || '';
      obfsParam = searchParams.get('obfsparam') || '';
      protocolParam = searchParams.get('protoparam') || '';
      group = searchParams.get('group') || '';

      try {
        if (remark) remark = base64Decode(remark);
      } catch { /* keep as is */ }
      try {
        if (obfsParam) obfsParam = base64Decode(obfsParam);
      } catch { /* keep as is */ }
      try {
        if (protocolParam) protocolParam = base64Decode(protocolParam);
      } catch { /* keep as is */ }
      try {
        if (group) group = base64Decode(group);
      } catch { /* keep as is */ }
    }

    const proxy = new Proxy(ProxyType.ShadowsocksR);
    proxy.hostname = server;
    proxy.port = port;
    proxy.password = password;
    proxy.encryptMethod = method;
    proxy.protocol = protocol;
    proxy.protocolParam = protocolParam;
    proxy.obfs = obfs;
    proxy.obfsParam = obfsParam;
    proxy.remark = remark || `${server}:${port}`;
    proxy.group = group;

    return proxy;
  } catch {
    return null;
  }
}
