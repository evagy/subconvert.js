import { describe, it, expect } from 'vitest';
import {
  base64Encode,
  base64Decode,
  base64UrlEncode,
  base64UrlDecode,
  isBase64,
} from '../src/utils/base64';
import {
  trimString,
  splitString,
  replaceAll,
  startsWith,
  endsWith,
  contains,
  isEmpty,
  isNumber,
  parseIntSafe,
  parseFloatSafe,
  urlEncode,
  urlDecode,
  getLines,
  matchRegex,
} from '../src/utils/common';
import {
  parseIni,
  getIniValue,
  getIniBool,
  getIniNumber,
  getIniArray,
} from '../src/utils/ini';
import { isUrl } from '../src/utils/url';

describe('Base64 Utilities', () => {
  it('should encode and decode base64', () => {
    const original = 'Hello, World!';
    const encoded = base64Encode(original);
    const decoded = base64Decode(encoded);

    expect(encoded).toBe('SGVsbG8sIFdvcmxkIQ==');
    expect(decoded).toBe(original);
  });

  it('should encode and decode base64url', () => {
    const original = 'test+data/here=';
    const encoded = base64UrlEncode(original);
    const decoded = base64UrlDecode(encoded);

    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
    expect(decoded).toBe(original);
  });

  it('should detect base64 content', () => {
    const valid = Buffer.from('ss://test').toString('base64');
    expect(isBase64(valid)).toBe(true);
    expect(isBase64('not base64 with spaces')).toBe(false);
    expect(isBase64('short')).toBe(false);
  });
});

describe('Common Utilities', () => {
  it('should trim string', () => {
    expect(trimString('  hello  ')).toBe('hello');
    expect(trimString('##hello##', '#')).toBe('hello');
  });

  it('should split string', () => {
    expect(splitString('a,b,c', ',')).toEqual(['a', 'b', 'c']);
    expect(splitString('a, b , c', ',')).toEqual(['a', 'b', 'c']);
    expect(splitString('', ',')).toEqual([]);
  });

  it('should replace all occurrences', () => {
    expect(replaceAll('hello world hello', 'hello', 'hi')).toBe('hi world hi');
  });

  it('should check prefix and suffix', () => {
    expect(startsWith('hello world', 'hello')).toBe(true);
    expect(startsWith('hello world', 'world')).toBe(false);
    expect(endsWith('hello world', 'world')).toBe(true);
  });

  it('should check if string contains substring', () => {
    expect(contains('hello world', 'world')).toBe(true);
    expect(contains('hello world', 'xyz')).toBe(false);
  });

  it('should check if string is empty', () => {
    expect(isEmpty('')).toBe(true);
    expect(isEmpty('  ')).toBe(true);
    expect(isEmpty('hello')).toBe(false);
  });

  it('should check if string is number', () => {
    expect(isNumber('123')).toBe(true);
    expect(isNumber('12.3')).toBe(false);
    expect(isNumber('abc')).toBe(false);
  });

  it('should parse int safely', () => {
    expect(parseIntSafe('123')).toBe(123);
    expect(parseIntSafe('abc', 0)).toBe(0);
    expect(parseIntSafe('abc', 42)).toBe(42);
  });

  it('should parse float safely', () => {
    expect(parseFloatSafe('12.5')).toBe(12.5);
    expect(parseFloatSafe('abc', 0)).toBe(0);
  });

  it('should encode and decode URL', () => {
    const original = 'hello world&test=value';
    const encoded = urlEncode(original);
    const decoded = urlDecode(encoded);

    expect(encoded).not.toContain(' ');
    expect(decoded).toBe(original);
  });

  it('should get lines from string', () => {
    const text = 'line1\nline2\n\nline3\r\nline4';
    const lines = getLines(text);

    expect(lines).toEqual(['line1', 'line2', 'line3', 'line4']);
  });

  it('should match regex', () => {
    expect(matchRegex('hello world', 'hello.*world')).toBe(true);
    expect(matchRegex('hello world', '^hello$')).toBe(false);
    expect(matchRegex('test123', '\\d+')).toBe(true);
  });
});

describe('INI Parser', () => {
  it('should parse ini content', () => {
    const content = `
[section1]
key1 = value1
key2 = value2

[section2]
key3 = value3
`;
    const data = parseIni(content);

    expect(data['section1']).toBeDefined();
    expect(data['section1']['key1']).toBe('value1');
    expect(data['section1']['key2']).toBe('value2');
    expect(data['section2']['key3']).toBe('value3');
  });

  it('should get ini value with default', () => {
    const data = parseIni('[section]\nkey = value');

    expect(getIniValue(data, 'section', 'key')).toBe('value');
    expect(getIniValue(data, 'section', 'missing', 'default')).toBe('default');
    expect(getIniValue(data, 'missing', 'key', 'default')).toBe('default');
  });

  it('should get ini boolean', () => {
    const data = parseIni(`
[section]
bool1 = true
bool2 = false
bool3 = 1
bool4 = yes
bool5 = no
`);

    expect(getIniBool(data, 'section', 'bool1')).toBe(true);
    expect(getIniBool(data, 'section', 'bool2')).toBe(false);
    expect(getIniBool(data, 'section', 'bool3')).toBe(true);
    expect(getIniBool(data, 'section', 'bool4')).toBe(true);
    expect(getIniBool(data, 'section', 'bool5')).toBe(false);
    expect(getIniBool(data, 'section', 'missing', true)).toBe(true);
  });

  it('should get ini number', () => {
    const data = parseIni(`
[section]
port = 8080
invalid = abc
`);

    expect(getIniNumber(data, 'section', 'port')).toBe(8080);
    expect(getIniNumber(data, 'section', 'invalid', 0)).toBe(0);
    expect(getIniNumber(data, 'section', 'missing', 3000)).toBe(3000);
  });

  it('should get ini array', () => {
    const data = parseIni(`
[section]
list = a,b,c
empty =
`);

    expect(getIniArray(data, 'section', 'list')).toEqual(['a', 'b', 'c']);
    expect(getIniArray(data, 'section', 'empty')).toEqual([]);
    expect(getIniArray(data, 'section', 'missing')).toEqual([]);
    expect(getIniArray(data, 'section', 'list', '|')).toEqual(['a,b,c']);
  });
});

describe('URL Utilities', () => {
  it('should detect valid URLs', () => {
    expect(isUrl('https://example.com')).toBe(true);
    expect(isUrl('http://example.com/path')).toBe(true);
    expect(isUrl('ftp://example.com')).toBe(false);
    expect(isUrl('not a url')).toBe(false);
    expect(isUrl('ss://base64data')).toBe(false);
  });
});
