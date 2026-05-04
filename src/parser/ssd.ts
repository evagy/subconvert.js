import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { base64Decode } from '../utils/base64';

export function parseSSD(content: string): Proxy[] {
  const proxies: Proxy[] = [];

  try {
    let jsonStr: string;
    try {
      jsonStr = base64Decode(content.trim());
    } catch {
      jsonStr = content.trim();
    }

    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') return proxies;

    const server = data.server || '';
    const port = parseInt(data.port || '0', 10);
    const method = data.method || '';
    const password = data.password || '';
    const remarks = data.remarks || '';

    // SSD format can have multiple servers in "servers" array
    const servers = data.servers || [];

    if (servers.length > 0) {
      for (const srv of servers) {
        const proxy = new Proxy(ProxyType.Shadowsocks);
        proxy.hostname = srv.server || server;
        proxy.port = parseInt(String(srv.port || port), 10);
        proxy.encryptMethod = srv.method || method;
        proxy.password = srv.password || password;
        proxy.remark = srv.remarks || `${proxy.hostname}:${proxy.port}`;

        if (srv.plugin) {
          proxy.plugin = srv.plugin;
          proxy.pluginOption = srv.plugin_options || '';
        }

        if (srv.udp) proxy.udp = TriBool.True;
        if (srv.tfo) proxy.tcpFastOpen = TriBool.True;

        proxies.push(proxy);
      }
    } else if (server) {
      // Single server format
      const proxy = new Proxy(ProxyType.Shadowsocks);
      proxy.hostname = server;
      proxy.port = port;
      proxy.encryptMethod = method;
      proxy.password = password;
      proxy.remark = remarks || `${server}:${port}`;

      proxies.push(proxy);
    }
  } catch {
    // Parse error
  }

  return proxies;
}
