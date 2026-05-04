import axios, { AxiosRequestConfig } from 'axios';

const cache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchUrl(
  url: string,
  options: {
    timeout?: number;
    headers?: Record<string, string>;
    proxy?: string;
    useCache?: boolean;
  } = {}
): Promise<string> {
  const { timeout = 30000, headers = {}, useCache = true } = options;

  // Check cache
  if (useCache) {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const config: AxiosRequestConfig = {
    timeout,
    headers: {
      'User-Agent': 'clash-verge/v2.0.0',
      ...headers,
    },
    responseType: 'text',
    maxRedirects: 10,
  };

  const response = await axios.get(url, config);
  const data = response.data as string;

  // Store in cache
  if (useCache) {
    cache.set(url, { data, timestamp: Date.now() });
  }

  return data;
}

export function clearCache(): void {
  cache.clear();
}

export function getCacheSize(): number {
  return cache.size;
}

export function isUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
