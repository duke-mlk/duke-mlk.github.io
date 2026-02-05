// Service worker — serves the proxied app at /__app__ and proxies
// /data/, /ml/, /images/ requests to the GitHub API.
//
// The iframe src is set to https://duke-mlk.github.io/__app__ (a real
// HTTPS URL this SW controls) rather than a blob URL. That makes the
// iframe same-origin with this SW, so ALL its resource loads are
// intercepted here — including native image and CSS background fetches.

const REPO = {
  apiBase: 'https://api.github.com',
  owner: 'duke-mlk',
  name: 'medical-flow',
  branch: 'gh-pages'
};

let token = null;
let appHtml = null;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('message', event => {
  if (event.data?.type === 'SET_TOKEN') token = event.data.token;
  if (event.data?.type === 'CLEAR_TOKEN') token = null;
  if (event.data?.type === 'SET_APP_CONTENT') {
    appHtml = event.data.html;
    // Acknowledge via MessageChannel so Proxy.tsx can sequence the iframe mount
    event.ports[0]?.postMessage({ type: 'READY' });
  }
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Serve the proxied app HTML at /__app__
  if (url.pathname === '/__app__') {
    const html = appHtml ?? '<p style="font-family:sans-serif;padding:2rem">Loading…</p>';
    event.respondWith(new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    }));
    return;
  }

  // Proxy asset and data requests using the auth token
  if (!token) return;
  if (
    !url.pathname.startsWith('/data/') &&
    !url.pathname.startsWith('/ml/') &&
    !url.pathname.startsWith('/images/')
  ) return;

  event.respondWith(proxyToGitHub(url.pathname.slice(1)));
});

function mimeType(path) {
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  return 'application/json';
}

async function proxyToGitHub(path) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json'
  };

  const res = await fetch(
    `${REPO.apiBase}/repos/${REPO.owner}/${REPO.name}/contents/${path}?ref=${REPO.branch}`,
    { headers }
  );
  if (!res.ok) return res;

  const data = await res.json();
  let base64 = data.content;

  // Large files (>1 MB) have encoding "none" — use Git Blob API
  if (data.encoding === 'none' || !base64) {
    const blobRes = await fetch(
      `${REPO.apiBase}/repos/${REPO.owner}/${REPO.name}/git/blobs/${data.sha}`,
      { headers }
    );
    if (!blobRes.ok) return blobRes;
    base64 = (await blobRes.json()).content;
  }

  const binary = atob(base64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return new Response(bytes, {
    status: 200,
    headers: { 'Content-Type': mimeType(path) }
  });
}
