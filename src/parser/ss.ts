import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { base64Decode } from '../utils/base64';
import { urlDecode } from '../utils/common';

export function parseSS(link: string): Proxy | null {
  // SIP002 format: ss://base64(method:password)@server:port#remark
  // or: ss://base64(method:password@server:port)#remark
  // or: ss://base64(method:password@server:port?plugin=xxx)#remark

  try {
    if (!link.startsWith('ss://')) return null;
    const content = link.slice(5);

    const hashIndex = content.indexOf('#');
    let remark = '';
    let body = content;
    if (hashIndex !== -1) {
      remark = urlDecode(content.slice(hashIndex + 1));
      body = content.slice(0, hashIndex);
    }

    const questionIndex = body.indexOf('?');
    let pluginOption = '';
    if (questionIndex !== -1) {
      const params = new URLSearchParams(body.slice(questionIndex + 1));
      pluginOption = params.get('plugin') || '';
      body = body.slice(0, questionIndex);
    }

    const atIndex = body.indexOf('@');
    let method: string;
    let password: string;
    let server: string;
    let port: number;

    if (atIndex !== -1) {
      // SIP002 format: base64(method:password)@server:port
      const userInfo = base64Decode(body.slice(0, atIndex));
      const colonIndex = userInfo.indexOf(':');
      if (colonIndex === -1) return null;
      method = userInfo.slice(0, colonIndex);
      password = userInfo.slice(colonIndex + 1);

      const serverPort = body.slice(atIndex + 1);
      const lastColon = serverPort.lastIndexOf(':');
      if (lastColon === -1) return null;
      server = serverPort.slice(0, lastColon);
      port = parseInt(serverPort.slice(lastColon + 1), 10);
    } else {
      // Legacy format: base64(method:password@server:port)
      const decoded = base64Decode(body);
      const atIdx = decoded.lastIndexOf('@');
      if (atIdx === -1) return null;

      const methodPass = decoded.slice(0, atIdx);
      const colonIdx = methodPass.indexOf(':');
      if (colonIdx === -1) return null;
      method = methodPass.slice(0, colonIdx);
      password = methodPass.slice(colonIdx + 1);

      const serverPortStr = decoded.slice(atIdx + 1);
      const lastColon = serverPortStr.lastIndexOf(':');
      if (lastColon === -1) return null;
      server = serverPortStr.slice(0, lastColon);
      port = parseInt(serverPortStr.slice(lastColon + 1), 10);
    }

    const proxy = new Proxy(ProxyType.Shadowsocks);
    proxy.hostname = server;
    proxy.port = port;
    proxy.password = password;
    proxy.encryptMethod = method;
    proxy.remark = remark || `${server}:${port}`;

    if (pluginOption) {
      const parts = pluginOption.split(';');
      proxy.plugin = parts[0];
      proxy.pluginOption = parts.slice(1).join(';');
    }

    return proxy;
  } catch {
    return null;
  }
}
