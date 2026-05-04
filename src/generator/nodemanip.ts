import { Proxy, ProxyType, TriBool } from '../config/proxy';
import { RegexMatchConfig } from '../config/regmatch';
import { EmojiMap } from '../config/settings';
import { fetchUrl } from '../utils/url';
import { parseSubscription, parseSingleLink } from '../parser/subscription';
import { explode, detectType, ConfType } from '../parser/subparser';

export async function addNodes(
  urls: string[],
  includeRemark: string[],
  excludeRemark: string[],
  group = ''
): Promise<Proxy[]> {
  const proxies: Proxy[] = [];

  for (const url of urls) {
    try {
      let content: string;

      if (url.startsWith('http://') || url.startsWith('https://')) {
        content = await fetchUrl(url);
      } else {
        content = url;
      }

      const type = detectType(content);
      let parsed: Proxy[];

      if (type === ConfType.Unset) {
        // Try as individual links
        parsed = explode(content, ConfType.Unset);
      } else {
        parsed = explode(content, type);
      }

      // Apply include/exclude filters
      for (const proxy of parsed) {
        if (group) proxy.group = group;

        if (!matchRemark(proxy.remark, includeRemark, excludeRemark)) {
          continue;
        }

        proxies.push(proxy);
      }
    } catch (error) {
      console.error(`Failed to fetch/parse URL: ${url}`, error);
    }
  }

  return proxies;
}

export function filterNodes(
  proxies: Proxy[],
  includeRemark: string[],
  excludeRemark: string[]
): Proxy[] {
  return proxies.filter(proxy => matchRemark(proxy.remark, includeRemark, excludeRemark));
}

function matchRemark(remark: string, include: string[], exclude: string[]): boolean {
  // Check include filters (if any, remark must match at least one)
  if (include.length > 0) {
    let matched = false;
    for (const pattern of include) {
      try {
        if (new RegExp(pattern, 'i').test(remark)) {
          matched = true;
          break;
        }
      } catch {
        if (remark.toLowerCase().includes(pattern.toLowerCase())) {
          matched = true;
          break;
        }
      }
    }
    if (!matched) return false;
  }

  // Check exclude filters (remark must not match any)
  for (const pattern of exclude) {
    try {
      if (new RegExp(pattern, 'i').test(remark)) {
        return false;
      }
    } catch {
      if (remark.toLowerCase().includes(pattern.toLowerCase())) {
        return false;
      }
    }
  }

  return true;
}

export function preprocessNodes(
  proxies: Proxy[],
  options: {
    renameRules?: RegexMatchConfig[];
    emojiRules?: EmojiMap[];
    addEmoji?: boolean;
    removeEmoji?: boolean;
    appendType?: boolean;
    sort?: boolean;
    udp?: boolean;
    tfo?: boolean;
    scv?: boolean;
    tls13?: boolean;
  } = {}
): Proxy[] {
  let result = [...proxies];

  // Apply rename rules
  if (options.renameRules && options.renameRules.length > 0) {
    result = result.map(proxy => {
      let remark = proxy.remark;
      for (const rule of options.renameRules!) {
        try {
          remark = remark.replace(rule.match, rule.replace);
        } catch {
          // Skip invalid regex
        }
      }
      proxy.remark = remark;
      return proxy;
    });
  }

  // Apply emoji rules
  if (options.addEmoji && options.emojiRules && options.emojiRules.length > 0) {
    result = result.map(proxy => {
      for (const emoji of options.emojiRules!) {
        for (const pattern of emoji.match) {
          try {
            if (new RegExp(pattern, 'i').test(proxy.remark)) {
              proxy.remark = emoji.emoji + proxy.remark;
              break;
            }
          } catch {
            if (proxy.remark.toLowerCase().includes(pattern.toLowerCase())) {
              proxy.remark = emoji.emoji + proxy.remark;
              break;
            }
          }
        }
      }
      return proxy;
    });
  }

  // Remove emoji
  if (options.removeEmoji) {
    result = result.map(proxy => {
      // Remove common emoji characters
      proxy.remark = proxy.remark.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
      return proxy;
    });
  }

  // Append type
  if (options.appendType) {
    result = result.map(proxy => {
      const typeName = getTypeName(proxy.type);
      if (typeName && !proxy.remark.includes(typeName)) {
        proxy.remark = `${proxy.remark} [${typeName}]`;
      }
      return proxy;
    });
  }

  // Apply global settings
  if (options.udp || options.tfo || options.scv || options.tls13) {
    result = result.map(proxy => {
      if (options.udp) proxy.udp = TriBool.True;
      if (options.tfo) proxy.tcpFastOpen = TriBool.True;
      if (options.scv) proxy.allowInsecure = TriBool.True;
      if (options.tls13) proxy.tls13 = TriBool.True;
      return proxy;
    });
  }

  // Sort
  if (options.sort) {
    result.sort((a, b) => a.remark.localeCompare(b.remark));
  }

  return result;
}

function getTypeName(type: ProxyType): string {
  switch (type) {
    case ProxyType.Shadowsocks: return 'SS';
    case ProxyType.ShadowsocksR: return 'SSR';
    case ProxyType.VMess: return 'VMess';
    case ProxyType.Trojan: return 'Trojan';
    case ProxyType.HTTP: return 'HTTP';
    case ProxyType.HTTPS: return 'HTTPS';
    case ProxyType.SOCKS5: return 'SOCKS5';
    case ProxyType.WireGuard: return 'WG';
    case ProxyType.Hysteria: return 'HY';
    case ProxyType.Hysteria2: return 'HY2';
    default: return '';
  }
}
