import { Proxy } from '../config/proxy';
import { base64Decode, isBase64 } from '../utils/base64';
import { getLines } from '../utils/common';
import { parseSS } from './ss';
import { parseSSR } from './ssr';
import { parseVmess } from './vmess';
import { parseTrojan } from './trojan';
import { parseHysteria2 } from './hysteria2';
import { parseClash } from './clash';
import { parseSurge } from './surge';
import { parseQuan } from './quan';
import { parseSSD } from './ssd';

export function parseSubscription(content: string): Proxy[] {
  const trimmed = content.trim();

  // Try to detect format and parse
  if (isBase64(trimmed)) {
    return parseBase64Subscription(trimmed);
  }

  // Try Clash YAML format
  if (trimmed.includes('proxies:') || trimmed.includes('proxy-groups:')) {
    return parseClash(trimmed);
  }

  // Try Surge format
  if (trimmed.includes('[Proxy]') || trimmed.includes('[proxy]')) {
    return parseSurge(trimmed);
  }

  // Try SSD format
  if (trimmed.startsWith('ssd://') || trimmed.startsWith('{')) {
    return parseSSD(trimmed);
  }

  // Try as a list of links
  return parseLinkList(trimmed);
}

function parseBase64Subscription(content: string): Proxy[] {
  try {
    const decoded = base64Decode(content.trim());
    return parseLinkList(decoded);
  } catch {
    return [];
  }
}

export function parseLinkList(content: string): Proxy[] {
  const proxies: Proxy[] = [];
  const lines = getLines(content);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const proxy = parseSingleLink(trimmed);
    if (proxy) proxies.push(proxy);
  }

  return proxies;
}

export function parseSingleLink(link: string): Proxy | null {
  const trimmed = link.trim();

  // Dispatch by prefix
  if (trimmed.startsWith('ss://')) return parseSS(trimmed);
  if (trimmed.startsWith('ssr://')) return parseSSR(trimmed);
  if (trimmed.startsWith('vmess://') || trimmed.startsWith('vmess1://')) return parseVmess(trimmed);
  if (trimmed.startsWith('trojan://')) return parseTrojan(trimmed);
  if (trimmed.startsWith('hy2://') || trimmed.startsWith('hysteria2://')) return parseHysteria2(trimmed);
  if (trimmed.startsWith('ssd://')) {
    const proxies = parseSSD(trimmed);
    return proxies.length > 0 ? proxies[0] : null;
  }

  // Try Quantumult format (inline text with key=value)
  if (trimmed.includes('type=') && trimmed.includes('server=')) {
    const proxies = parseQuan(trimmed);
    return proxies.length > 0 ? proxies[0] : null;
  }

  return null;
}
