import * as ini from 'ini';

export interface IniData {
  [section: string]: {
    [key: string]: string;
  };
}

export function parseIni(content: string): IniData {
  return ini.parse(content) as IniData;
}

export function stringifyIni(data: IniData): string {
  return ini.stringify(data);
}

export function getIniValue(data: IniData, section: string, key: string, defaultValue = ''): string {
  return data[section]?.[key] ?? defaultValue;
}

export function getIniBool(data: IniData, section: string, key: string, defaultValue = false): boolean {
  const val = String(getIniValue(data, section, key, '')).toLowerCase();
  if (val === 'true' || val === '1' || val === 'yes') return true;
  if (val === 'false' || val === '0' || val === 'no') return false;
  return defaultValue;
}

export function getIniNumber(data: IniData, section: string, key: string, defaultValue = 0): number {
  const val = String(getIniValue(data, section, key, ''));
  const n = parseInt(val, 10);
  return isNaN(n) ? defaultValue : n;
}

export function getIniArray(data: IniData, section: string, key: string, separator = ','): string[] {
  const val = String(getIniValue(data, section, key, ''));
  if (!val) return [];
  return val.split(separator).map(s => s.trim()).filter(Boolean);
}
