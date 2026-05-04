import { Request, Response } from 'express';
import { Proxy } from '../config/proxy';
import { ProxyGroupConfig, ProxyGroupType } from '../config/proxygroup';
import { RulesetConfig } from '../config/ruleset';
import { RegexMatchConfig } from '../config/regmatch';
import { Settings, ExternalConfig, EmojiMap, createDefaultSettings } from '../config/settings';
import { addNodes, filterNodes, preprocessNodes } from '../generator/nodemanip';
import { exportConfig, autoDetectTarget, TargetFormat } from '../generator/subexport';
import { fetchUrl } from '../utils/url';
import { base64Decode } from '../utils/base64';
import { parseIni, getIniValue, getIniBool, getIniNumber, getIniArray } from '../utils/ini';
import { initTemplateEngine } from '../utils/template';

// User-Agent detection
const UA_MATCH_LIST: [RegExp, TargetFormat, number?][] = [
  [/ClashForAndroid/i, 'clash'],
  [/ClashX/i, 'clash'],
  [/Clash/i, 'clash'],
  [/Surge[/\s]*(\d+)/i, 'surge', 1],
  [/Quantumult\s*X/i, 'quanx'],
  [/Quantumult/i, 'quan'],
  [/Loon/i, 'loon'],
  [/Shadowrocket/i, 'mixed'],
  [/Sing[-]?Box/i, 'singbox'],
  [/Surfboard/i, 'surfboard'],
];

let settings: Settings = createDefaultSettings();

export function getSettings(): Settings {
  return settings;
}

export async function loadSettings(configPath: string): Promise<void> {
  try {
    let content: string;

    // Check if it's a URL or local file
    if (configPath.startsWith('http://') || configPath.startsWith('https://')) {
      content = await fetchUrl(configPath, { useCache: false });
    } else {
      // Local file
      const fs = await import('fs');
      const path = await import('path');
      const resolvedPath = path.resolve(configPath);
      content = fs.readFileSync(resolvedPath, 'utf-8');
    }

    const data = parseIni(content);

    settings.apiMode = getIniBool(data, 'common', 'api_mode', false);
    settings.accessToken = getIniValue(data, 'common', 'access_token', '');
    settings.defaultUrls = getIniArray(data, 'common', 'default_url', '|');
    settings.insertUrls = getIniArray(data, 'common', 'insert_url', '|');
    settings.excludeRemarks = getIniArray(data, 'common', 'exclude_remark', '|');
    settings.includeRemarks = getIniArray(data, 'common', 'include_remark', '|');
    settings.externalConfig = getIniValue(data, 'common', 'external_config', '');

    settings.udp = getIniBool(data, 'node_pref', 'udp', false);
    settings.tfo = getIniBool(data, 'node_pref', 'tcp_fast_open', false);
    settings.scv = getIniBool(data, 'node_pref', 'skip_cert_verify', false);
    settings.sort = getIniBool(data, 'node_pref', 'sort', false);
    settings.appendType = getIniBool(data, 'node_pref', 'append_type', false);
    settings.newFieldNames = getIniBool(data, 'node_pref', 'new_field_name', false);

    settings.addEmoji = getIniBool(data, 'node_pref', 'add_emoji', false);
    settings.removeEmoji = getIniBool(data, 'node_pref', 'remove_old_emoji', false);

    // Load emojis
    settings.emojis = [];
    const emojiSection = data['emojis'];
    if (emojiSection) {
      for (const [key, value] of Object.entries(emojiSection)) {
        if (value && typeof value === 'string') {
          settings.emojis.push({
            match: key.split('|').map(s => s.trim()),
            emoji: value.trim(),
          });
        }
      }
    }

    // Load renames
    settings.renames = [];
    const renameSection = data['rename_remarks'];
    if (renameSection) {
      for (const [key, value] of Object.entries(renameSection)) {
        if (value && typeof value === 'string') {
          settings.renames.push(new RegexMatchConfig(key, value));
        }
      }
    }

    // Load proxy groups
    settings.proxyGroups = [];
    const groupSection = data['proxy_groups'];
    if (groupSection) {
      for (const [key, value] of Object.entries(groupSection)) {
        if (value && typeof value === 'string') {
          const parts = value.split('@').map(s => s.trim());
          const group = new ProxyGroupConfig(key, parts[0] as ProxyGroupType);
          group.proxies = parts.slice(1);
          settings.proxyGroups.push(group);
        }
      }
    }

    // Load rulesets
    settings.rulesets = [];
    const rulesetSection = data['rulesets'];
    if (rulesetSection) {
      for (const [key, value] of Object.entries(rulesetSection)) {
        if (value && typeof value === 'string') {
          const parts = value.split('@').map(s => s.trim());
          settings.rulesets.push(new RulesetConfig(key, parts[0], parseInt(parts[1] || '0', 10)));
        }
      }
    }

    settings.listenAddress = getIniValue(data, 'server', 'listen', '0.0.0.0');
    settings.listenPort = getIniNumber(data, 'server', 'port', 25500);

    // Initialize template engine
    if (settings.basePath) {
      initTemplateEngine(settings.basePath);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

export async function subconverterHandler(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query;

    // Get target format
    let target = (query.target as string || 'clash').toLowerCase() as TargetFormat;
    const userAgent = req.headers['user-agent'] || '';

    // Auto-detect target from User-Agent
    if (target === 'auto') {
      target = autoDetectTarget(userAgent);
    }

    // Get URL(s)
    const urlParam = query.url as string;
    if (!urlParam) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }

    const urls = urlParam.split('|').map(u => u.trim()).filter(Boolean);

    // Parse options
    const group = (query.group as string) || '';
    const surgeVersion = parseInt(query.ver as string || '3', 10);
    const newFieldNames = query.new_name === 'true' || settings.newFieldNames;
    const addEmoji = query.add_emoji === 'true' || query.emoji === 'true' || settings.addEmoji;
    const removeEmoji = query.remove_emoji === 'true' || settings.removeEmoji;
    const appendType = query.append_type === 'true' || settings.appendType;
    const sort = query.sort === 'true' || settings.sort;
    const udp = query.udp === 'true' || settings.udp;
    const tfo = query.tfo === 'true' || settings.tfo;
    const scv = query.scv === 'true' || settings.scv;
    const tls13 = query.tls13 === 'true';
    const classic = query.classic === 'true';
    const list = query.list === 'true';
    const devId = (query.dev_id as string) || '';

    // Parse include/exclude filters
    const includeRemark = (query.include as string || '').split('`').filter(Boolean);
    const excludeRemark = (query.exclude as string || '').split('`').filter(Boolean);

    // Merge with settings
    const allInclude = [...settings.includeRemarks, ...includeRemark];
    const allExclude = [...settings.excludeRemarks, ...excludeRemark];

    // Parse rename rules
    let renameRules = [...settings.renames];
    const renameParam = query.rename as string;
    if (renameParam) {
      const rules = renameParam.split('`');
      for (const rule of rules) {
        const parts = rule.split('@');
        if (parts.length >= 2) {
          renameRules.push(new RegexMatchConfig(parts[0], parts[1]));
        }
      }
    }

    // Parse emoji rules
    let emojiRules = [...settings.emojis];

    // Load external config if specified
    let proxyGroups = [...settings.proxyGroups];
    let rulesets = [...settings.rulesets];

    const configUrl = query.config as string;
    if (configUrl) {
      try {
        const extConfig = await loadExternalConfig(configUrl);
        if (extConfig.proxyGroup.length > 0) proxyGroups = extConfig.proxyGroup;
        if (extConfig.ruleset.length > 0) rulesets = extConfig.ruleset;
        if (extConfig.renameNode.length > 0) renameRules = [...renameRules, ...extConfig.renameNode];
        if (extConfig.emojiAdd.length > 0) emojiRules = [...emojiRules, ...extConfig.emojiAdd];
        if (extConfig.includeRemark.length > 0) allInclude.push(...extConfig.includeRemark);
        if (extConfig.excludeRemark.length > 0) allExclude.push(...extConfig.excludeRemark);
      } catch (error) {
        console.error('Failed to load external config:', error);
      }
    }

    // Fetch and parse nodes
    let proxies = await addNodes(urls, allInclude, allExclude, group);

    // Preprocess nodes
    proxies = preprocessNodes(proxies, {
      renameRules,
      emojiRules,
      addEmoji,
      removeEmoji,
      appendType,
      sort,
      udp,
      tfo,
      scv,
      tls13,
    });

    // Fetch ruleset content
    const rulesetContent = new Map<string, string>();
    for (const rs of rulesets) {
      if (rs.url) {
        try {
          const content = await fetchUrl(rs.url);
          rulesetContent.set(rs.url, content);
        } catch (error) {
          console.error(`Failed to fetch ruleset: ${rs.url}`, error);
        }
      }
    }

    // Export config
    const output = exportConfig({
      target,
      proxies,
      proxyGroups,
      rulesets,
      rulesetContent,
      surgeVersion,
      newFieldNames,
      classic,
      clashR: target === 'clashr',
      devId,
      list,
    });

    // Set response headers
    const filename = (query.filename as string) || `subconverter_${target}`;
    res.setHeader('Content-Type', getContentType(target));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Subscription-Userinfo', 'upload=0; download=0; total=0; expire=0');

    res.send(output);
  } catch (error) {
    console.error('Subconverter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function loadExternalConfig(url: string): Promise<ExternalConfig> {
  const content = await fetchUrl(url);
  const data = parseIni(content);

  const config: ExternalConfig = {
    renameNode: [],
    emojiAdd: [],
    emojiRemove: [],
    includeRemark: [],
    excludeRemark: [],
    proxyGroup: [],
    ruleset: [],
    customTemplate: '',
  };

  // Parse rename rules
  const renameSection = data['rename_remarks'];
  if (renameSection) {
    for (const [key, value] of Object.entries(renameSection)) {
      if (value && typeof value === 'string') {
        config.renameNode.push(new RegexMatchConfig(key, value));
      }
    }
  }

  // Parse emojis
  const emojiSection = data['emojis'];
  if (emojiSection) {
    for (const [key, value] of Object.entries(emojiSection)) {
      if (value && typeof value === 'string') {
        config.emojiAdd.push({
          match: key.split('|').map(s => s.trim()),
          emoji: value.trim(),
        });
      }
    }
  }

  // Parse proxy groups
  const groupSection = data['proxy_groups'];
  if (groupSection) {
    for (const [key, value] of Object.entries(groupSection)) {
      if (value && typeof value === 'string') {
        const parts = value.split('@').map(s => s.trim());
        const group = new ProxyGroupConfig(key, parts[0] as ProxyGroupType);
        group.proxies = parts.slice(1);
        config.proxyGroup.push(group);
      }
    }
  }

  // Parse rulesets
  const rulesetSection = data['rulesets'];
  if (rulesetSection) {
    for (const [key, value] of Object.entries(rulesetSection)) {
      if (value && typeof value === 'string') {
        const parts = value.split('@').map(s => s.trim());
        config.ruleset.push(new RulesetConfig(key, parts[0], parseInt(parts[1] || '0', 10)));
      }
    }
  }

  // Parse include/exclude
  config.includeRemark = getIniArray(data, 'common', 'include_remark', '|');
  config.excludeRemark = getIniArray(data, 'common', 'exclude_remark', '|');

  return config;
}

function getContentType(target: TargetFormat): string {
  switch (target) {
    case 'clash':
    case 'clashr':
    case 'surge':
    case 'surfboard':
    case 'quan':
    case 'quanx':
    case 'loon':
    case 'singbox':
      return 'text/plain; charset=utf-8';
    case 'ss':
    case 'ssr':
    case 'v2ray':
    case 'trojan':
    case 'mixed':
      return 'text/plain; charset=utf-8';
    default:
      return 'text/plain; charset=utf-8';
  }
}

export async function versionHandler(_req: Request, res: Response): Promise<void> {
  res.json({ version: '1.0.0', name: 'subconverter-ts' });
}

export async function flushCacheHandler(_req: Request, res: Response): Promise<void> {
  const { clearCache } = await import('../utils/url');
  clearCache();
  res.json({ status: 'ok', message: 'Cache flushed' });
}

export async function sub2clashrHandler(req: Request, res: Response): Promise<void> {
  try {
    const url = req.query.url as string;
    if (!url) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }

    // Simple SS/SSR to ClashR conversion
    const content = await fetchUrl(url);
    const { parseSubscription } = await import('../parser/subscription');
    const proxies = parseSubscription(content);

    const { proxyToClash } = await import('../generator/clash');
    const output = proxyToClash(proxies, [], [], new Map(), { clashR: true });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(output);
  } catch (error) {
    console.error('sub2clashr error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
