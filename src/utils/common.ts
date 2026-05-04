export function trimString(str: string, chars = ' \t\n\r'): string {
  let start = 0;
  let end = str.length;
  while (start < end && chars.includes(str[start])) start++;
  while (end > start && chars.includes(str[end - 1])) end--;
  return str.slice(start, end);
}

export function splitString(str: string, delimiter: string): string[] {
  if (!str) return [];
  return str.split(delimiter).map(s => s.trim()).filter(Boolean);
}

export function replaceAll(str: string, search: string, replacement: string): string {
  return str.split(search).join(replacement);
}

export function toLower(str: string): string {
  return str.toLowerCase();
}

export function toUpper(str: string): string {
  return str.toUpperCase();
}

export function startsWith(str: string, prefix: string): boolean {
  return str.startsWith(prefix);
}

export function endsWith(str: string, suffix: string): boolean {
  return str.endsWith(suffix);
}

export function contains(str: string, substr: string): boolean {
  return str.includes(substr);
}

export function isEmpty(str: string): boolean {
  return !str || str.trim().length === 0;
}

export function isNumber(str: string): boolean {
  return /^\d+$/.test(str);
}

export function parseIntSafe(str: string, defaultValue = 0): number {
  const n = parseInt(str, 10);
  return isNaN(n) ? defaultValue : n;
}

export function parseFloatSafe(str: string, defaultValue = 0): number {
  const n = parseFloat(str);
  return isNaN(n) ? defaultValue : n;
}

export function urlEncode(str: string): string {
  return encodeURIComponent(str);
}

export function urlDecode(str: string): string {
  return decodeURIComponent(str);
}

export function quoteWrap(str: string): string {
  if (str.includes('"') || str.includes("'") || str.includes(' ')) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}

export function getLines(str: string): string[] {
  return str.split(/\r?\n/).filter(line => line.trim().length > 0);
}

export function matchRegex(str: string, pattern: string): boolean {
  try {
    return new RegExp(pattern).test(str);
  } catch {
    return false;
  }
}

export function joinPath(...parts: string[]): string {
  return parts.join('/').replace(/\/+/g, '/');
}
