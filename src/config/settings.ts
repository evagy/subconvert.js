import { ProxyGroupConfig } from './proxygroup';
import { RulesetConfig } from './ruleset';
import { RegexMatchConfig } from './regmatch';

export interface EmojiMap {
  match: string[];
  emoji: string;
}

export interface ExternalConfig {
  renameNode: RegexMatchConfig[];
  emojiAdd: EmojiMap[];
  emojiRemove: EmojiMap[];
  includeRemark: string[];
  excludeRemark: string[];
  proxyGroup: ProxyGroupConfig[];
  ruleset: RulesetConfig[];
  customTemplate: string;
}

export interface Settings {
  // Common
  apiMode: boolean;
  accessToken: string;
  defaultUrls: string[];
  insertUrls: string[];
  excludeRemarks: string[];
  includeRemarks: string[];
  externalConfig: string;
  basePath: string;

  // Node preferences
  udp: boolean;
  tfo: boolean;
  scv: boolean;
  sort: boolean;
  appendType: boolean;
  newFieldNames: boolean;

  // Emoji
  addEmoji: boolean;
  removeEmoji: boolean;
  emojis: EmojiMap[];

  // Rename
  renames: RegexMatchConfig[];

  // Rulesets
  rulesets: RulesetConfig[];

  // Proxy groups
  proxyGroups: ProxyGroupConfig[];

  // Template
  templatePath: string;
  templateVars: Record<string, string>;

  // Server
  listenAddress: string;
  listenPort: number;

  // Managed config
  surgeRulesetUrl: string;
  surgeRulesetProxy: string;
}

export function createDefaultSettings(): Settings {
  return {
    apiMode: false,
    accessToken: '',
    defaultUrls: [],
    insertUrls: [],
    excludeRemarks: [],
    includeRemarks: [],
    externalConfig: '',
    basePath: './base',

    udp: false,
    tfo: false,
    scv: false,
    sort: false,
    appendType: false,
    newFieldNames: false,

    addEmoji: false,
    removeEmoji: false,
    emojis: [],

    renames: [],

    rulesets: [],

    proxyGroups: [],

    templatePath: '',
    templateVars: {},

    listenAddress: '0.0.0.0',
    listenPort: 25500,

    surgeRulesetUrl: '',
    surgeRulesetProxy: '',
  };
}
