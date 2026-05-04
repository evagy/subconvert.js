import { RulesetType } from '../config/ruleset';

export function convertRuleset(content: string, fromType: RulesetType, toType: RulesetType): string {
  if (fromType === toType) return content;

  // Parse source rules
  const rules = parseRuleset(content, fromType);

  // Convert to target format
  return rules.map(rule => formatRule(rule, toType)).join('\n');
}

interface Rule {
  type: string;
  value: string;
  policy: string;
}

function parseRuleset(content: string, type: RulesetType): Rule[] {
  const rules: Rule[] = [];
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));

  for (const line of lines) {
    const trimmed = line.trim();
    const parts = trimmed.split(',');

    if (type === RulesetType.Surge || type === RulesetType.QuanX) {
      // Surge/QuanX format: TYPE,VALUE,POLICY
      if (parts.length >= 2) {
        rules.push({
          type: parts[0].trim().toUpperCase(),
          value: parts[1].trim(),
          policy: parts.length > 2 ? parts[2].trim() : '',
        });
      }
    } else if (type === RulesetType.ClashDomain) {
      // Clash domain format: - DOMAIN-SUFFIX,xxx
      const match = trimmed.match(/^-?\s*(DOMAIN(?:-SUFFIX|-KEYWORD)?|IP-CIDR(?:6)?)\s*,\s*(.+)/i);
      if (match) {
        rules.push({
          type: match[1].toUpperCase(),
          value: match[2].trim(),
          policy: '',
        });
      }
    } else if (type === RulesetType.ClashClassical) {
      // Clash classical format: - TYPE,VALUE,POLICY
      const match = trimmed.match(/^-?\s*(\w[\w-]*)\s*,\s*([^,]+)(?:\s*,\s*(.+))?/i);
      if (match) {
        rules.push({
          type: match[1].toUpperCase(),
          value: match[2].trim(),
          policy: match[3]?.trim() || '',
        });
      }
    }
  }

  return rules;
}

function formatRule(rule: Rule, type: RulesetType): string {
  switch (type) {
    case RulesetType.Surge:
    case RulesetType.QuanX:
      return rule.policy
        ? `${rule.type},${rule.value},${rule.policy}`
        : `${rule.type},${rule.value}`;

    case RulesetType.ClashDomain:
    case RulesetType.ClashIPCIDR:
    case RulesetType.ClashClassical:
      return rule.policy
        ? `- ${rule.type},${rule.value},${rule.policy}`
        : `- ${rule.type},${rule.value}`;

    default:
      return `${rule.type},${rule.value}`;
  }
}

export function detectRulesetType(content: string): RulesetType {
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  if (lines.length === 0) return RulesetType.Surge;

  const firstLine = lines[0].trim();

  // Clash domain format: - DOMAIN-SUFFIX,xxx
  if (firstLine.match(/^-?\s*DOMAIN/i)) {
    return RulesetType.ClashDomain;
  }

  // Clash classical format: - TYPE,VALUE,POLICY
  if (firstLine.match(/^-?\s*\w+,\s*\w+/)) {
    return RulesetType.ClashClassical;
  }

  // Surge format: TYPE,VALUE,POLICY
  if (firstLine.match(/^[A-Z-]+,\s*\S+/)) {
    return RulesetType.Surge;
  }

  return RulesetType.Surge;
}
