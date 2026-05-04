export function base64Encode(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64');
}

export function base64Decode(str: string): string {
  // Add padding if needed
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf-8');
}

export function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64UrlDecode(str: string): string {
  const padded = str
    .replace(/-/g, '+')
    .replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf-8');
}

export function isBase64(str: string): boolean {
  try {
    const decoded = base64Decode(str.trim());
    // Check if decoded content looks like a subscription
    return decoded.includes('://') || decoded.includes('\n');
  } catch {
    return false;
  }
}
