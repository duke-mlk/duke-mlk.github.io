import { config } from '../config';
import { decodeBase64Utf8 } from '../utils/base64';
import type { Collaborator } from '../types';

export const TOKEN_EXPIRED = 'TOKEN_EXPIRED';

const { owner, name: repo, branch } = config.repository;
const repoBase = `${config.api.baseUrl}/repos/${owner}/${repo}`;

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json'
  };
}

function githubFetch(token: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${repoBase}${path}`, {
    ...init,
    headers: { ...githubHeaders(token), ...init?.headers }
  });
}

const cache = new Map<string, { content: string; etag: string }>();

export async function fetchFileContent(path: string, token: string): Promise<string> {
  const cached = cache.get(path);

  const headers: Record<string, string> = { ...githubHeaders(token) };
  if (cached) headers['If-None-Match'] = cached.etag;

  const response = await fetch(`${repoBase}/contents/${path}?ref=${branch}`, { headers });

  if (response.status === 304 && cached) {
    return cached.content;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  const etag = response.headers.get('ETag') || '';
  const data = await response.json();

  // Large files (>1MB) have encoding: "none" and no content — use Git Blob API
  if (data.encoding === 'none' || !data.content) {
    const blobResponse = await githubFetch(token, `/git/blobs/${data.sha}`);
    if (!blobResponse.ok) {
      throw new Error(`Failed to fetch blob for ${path}: ${blobResponse.status}`);
    }
    const blobData = await blobResponse.json();
    const content = decodeBase64Utf8(blobData.content);
    if (etag) cache.set(path, { content, etag });
    return content;
  }

  const content = decodeBase64Utf8(data.content);
  if (etag) cache.set(path, { content, etag });
  return content;
}

export async function checkRepositoryAccess(token: string): Promise<void> {
  const response = await githubFetch(token, '');

  if (response.status === 401) {
    throw new Error(TOKEN_EXPIRED);
  }

  if (!response.ok) {
    throw new Error(`Access denied: ${response.status}`);
  }
}

export async function fetchCollaborators(token: string): Promise<Collaborator[]> {
  const response = await githubFetch(token, '/collaborators');

  if (!response.ok) {
    throw new Error(`Failed to fetch collaborators: ${response.status}`);
  }

  return response.json();
}

export async function fetchUserPermission(token: string, username: string): Promise<'admin' | 'write' | 'read'> {
  const response = await githubFetch(token, `/collaborators/${username}/permission`);

  if (!response.ok) {
    throw new Error(`Failed to fetch permission: ${response.status}`);
  }

  const data = await response.json();
  return data.permission;
}

export async function addCollaborator(token: string, username: string, permission: string): Promise<'invited' | 'added'> {
  const response = await githubFetch(token, `/collaborators/${username}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permission })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to add collaborator: ${response.status}`);
  }

  return response.status === 201 ? 'invited' : 'added';
}

export async function removeCollaborator(token: string, username: string): Promise<void> {
  const response = await githubFetch(token, `/collaborators/${username}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error(`Failed to remove collaborator: ${response.status}`);
  }
}
