import { Proxy } from '../config/proxy';
import { parseClash } from './clash';
import { parseSurge } from './surge';
import { parseQuan } from './quan';
import { parseSSD } from './ssd';
import { parseSubscription, parseLinkList, parseSingleLink } from './subscription';

export enum ConfType {
  Unset = 0,
  SS = 1,
  SSR = 2,
  VMess = 3,
  V2RayN = 4,
  Quan = 5,
  Clash = 6,
  Surge = 7,
  SSD = 8,
  Sub = 9,
}

export function explode(content: string, type?: ConfType): Proxy[] {
  const trimmed = content.trim();

  // Auto-detect type if not specified
  if (type === undefined || type === ConfType.Unset) {
    type = detectType(trimmed);
  }

  switch (type) {
    case ConfType.Sub:
      return parseSubscription(trimmed);
    case ConfType.Clash:
      return parseClash(trimmed);
    case ConfType.Surge:
      return parseSurge(trimmed);
    case ConfType.Quan:
      return parseQuan(trimmed);
    case ConfType.SSD:
      return parseSSD(trimmed);
    case ConfType.V2RayN:
      return parseClash(trimmed); // V2RayN JSON is similar to Clash
    default:
      return parseLinkList(trimmed);
  }
}

export function detectType(content: string): ConfType {
  const trimmed = content.trim();

  // Check if it's base64-encoded subscription
  if (isBase64Content(trimmed)) {
    return ConfType.Sub;
  }

  // Clash YAML
  if (trimmed.includes('proxies:') || trimmed.includes('Proxy:') || trimmed.includes('proxy-groups:')) {
    return ConfType.Clash;
  }

  // Surge config
  if (trimmed.includes('[Proxy]') || trimmed.includes('[proxy]') || trimmed.includes('[General]')) {
    return ConfType.Surge;
  }

  // SSD
  if (trimmed.startsWith('ssd://')) {
    return ConfType.SSD;
  }

  // Quantumult
  if (trimmed.includes('type=shadowsocks') || trimmed.includes('type=vmess') || trimmed.includes('type=http')) {
    return ConfType.Quan;
  }

  // Default to link list
  return ConfType.Unset;
}

function isBase64Content(content: string): boolean {
  // Simple heuristic: if content is long, doesn't contain spaces, and decodes to valid UTF-8
  if (content.length < 20) return false;
  if (content.includes(' ') || content.includes('\n')) return false;
  if (!/^[A-Za-z0-9+/=]+$/.test(content)) return false;

  try {
    const decoded = Buffer.from(content, 'base64').toString('utf-8');
    return decoded.includes('://') || decoded.includes('\n');
  } catch {
    return false;
  }
}
