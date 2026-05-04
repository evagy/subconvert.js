import { Proxy } from '../config/proxy';
import { ProxyGroupConfig } from '../config/proxygroup';
import { RulesetConfig } from '../config/ruleset';
import { proxyToClash } from './clash';
import { proxyToSurge } from './surge';
import { proxyToQuanX } from './quanx';
import { proxyToLoon } from './loon';
import { proxyToSingBox } from './singbox';
import { proxyListToMixed, proxyListToBase64, proxyToSingleLink } from './single';
import { base64Encode } from '../utils/base64';

export type TargetFormat =
  | 'clash' | 'clashr'
  | 'surge' | 'surfboard'
  | 'quan' | 'quanx'
  | 'loon'
  | 'singbox'
  | 'ss' | 'ssr' | 'sssub' | 'ssd'
  | 'v2ray' | 'trojan'
  | 'mixed'
  | 'auto';

export interface ExportOptions {
  target: TargetFormat;
  proxies: Proxy[];
  proxyGroups: ProxyGroupConfig[];
  rulesets: RulesetConfig[];
  rulesetContent: Map<string, string>;
  surgeVersion?: number;
  newFieldNames?: boolean;
  classic?: boolean;
  clashR?: boolean;
  devId?: string;
  list?: boolean;
}

export function exportConfig(options: ExportOptions): string {
  const {
    target,
    proxies,
    proxyGroups,
    rulesets,
    rulesetContent,
    surgeVersion = 3,
    newFieldNames = false,
    classic = false,
    clashR = false,
    devId = '',
    list = false,
  } = options;

  // If list mode, just return the proxy list
  if (list) {
    return proxyListToMixed(proxies);
  }

  switch (target) {
    case 'clash':
    case 'clashr':
      return proxyToClash(proxies, proxyGroups, rulesets, rulesetContent, {
        newFieldNames,
        clashR: target === 'clashr',
        classic,
      });

    case 'surge':
      return proxyToSurge(proxies, proxyGroups, rulesets, rulesetContent, surgeVersion);

    case 'surfboard':
      return proxyToSurge(proxies, proxyGroups, rulesets, rulesetContent, -3);

    case 'quanx':
      return proxyToQuanX(proxies, proxyGroups, rulesets, rulesetContent, devId);

    case 'loon':
      return proxyToLoon(proxies, proxyGroups, rulesets, rulesetContent);

    case 'singbox':
      return proxyToSingBox(proxies, proxyGroups, rulesets, rulesetContent);

    case 'ss':
      return proxyListToBase64(
        proxies.filter(p => p.type === 1) // Shadowsocks
      );

    case 'ssr':
      return proxyListToBase64(
        proxies.filter(p => p.type === 2) // ShadowsocksR
      );

    case 'v2ray':
      return proxyListToBase64(
        proxies.filter(p => p.type === 3) // VMess
      );

    case 'trojan':
      return proxyListToMixed(
        proxies.filter(p => p.type === 4) // Trojan
      );

    case 'mixed':
    case 'sssub':
      return proxyListToBase64(proxies);

    case 'ssd':
      return generateSSD(proxies);

    default:
      return proxyListToMixed(proxies);
  }
}

function generateSSD(proxies: Proxy[]): string {
  const servers = proxies
    .filter(p => p.type === 1) // Only Shadowsocks
    .map(p => ({
      server: p.hostname,
      port: p.port,
      method: p.encryptMethod,
      password: p.password,
      remarks: p.remark,
    }));

  const ssd = {
    airport: 'Subconverter',
    port: 443,
    method: 'aes-256-gcm',
    servers,
  };

  return base64Encode(JSON.stringify(ssd));
}

export function autoDetectTarget(userAgent: string): TargetFormat {
  const ua = userAgent.toLowerCase();

  if (ua.includes('clash') || ua.includes('clashforandroid') || ua.includes('clashx')) {
    return 'clash';
  }
  if (ua.includes('surge')) {
    return 'surge';
  }
  if (ua.includes('quantumult')) {
    return 'quanx';
  }
  if (ua.includes('loon')) {
    return 'loon';
  }
  if (ua.includes('shadowrocket') || ua.includes('sub-store')) {
    return 'mixed';
  }
  if (ua.includes('sing-box') || ua.includes('singbox')) {
    return 'singbox';
  }

  return 'clash'; // Default
}
