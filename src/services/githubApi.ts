import { config } from '../config';
import { decodeBase64Utf8 } from '../utils/base64';

export const TOKEN_EXPIRED = 'TOKEN_EXPIRED';

interface CacheEntry {
  content: string;
  etag: string;
}

const cache = new Map<string, CacheEntry>();

function getCachedContent(path: string): CacheEntry | null {
  return cache.get(path) || null;
}

function setCachedContent(path: string, content: string, etag: string): void {
  cache.set(path, { content, etag });
}

interface FetchFileOptions {
  token: string;
  useCache?: boolean;
}

export async function fetchFileContent(path: string, options: FetchFileOptions): Promise<string> {
  const { token, useCache = true } = options;

  const cached = useCache ? getCachedContent(path) : null;

  const contentsUrl = `${config.api.baseUrl}/repos/${config.repository.owner}/${config.repository.name}/contents/${path}?ref=${config.repository.branch}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json'
  };
  if (cached) headers['If-None-Match'] = cached.etag;

  const response = await fetch(contentsUrl, { headers });

  if (response.status === 304 && cached) {
    return cached.content;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  const etag = response.headers.get('ETag') || '';
  const data = await response.json();

  // Large files (>1MB) have encoding: "none" and no content
  // Use Git Blob API which works for any size
  if (data.encoding === 'none' || !data.content) {
    if (!data.sha) {
      throw new Error(`No SHA for large file: ${path}`);
    }

    const blobUrl = `${config.api.baseUrl}/repos/${config.repository.owner}/${config.repository.name}/git/blobs/${data.sha}`;
    const blobResponse = await fetch(blobUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!blobResponse.ok) {
      throw new Error(`Failed to fetch blob for ${path}: ${blobResponse.status}`);
    }

    const blobData = await blobResponse.json();
    const content = decodeBase64Utf8(blobData.content);
    if (etag) setCachedContent(path, content, etag);
    return content;
  }

  const content = decodeBase64Utf8(data.content);
  if (etag) setCachedContent(path, content, etag);
  return content;
}

export async function checkRepositoryAccess(token: string): Promise<void> {
  const url = `${config.api.baseUrl}/repos/${config.repository.owner}/${config.repository.name}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json'
    }
  });

  if (response.status === 401) {
    throw new Error(TOKEN_EXPIRED);
  }

  if (!response.ok) {
    throw new Error(`Access denied: ${response.status}`);
  }
}

export function clearCache(): void {
  cache.clear();
}
