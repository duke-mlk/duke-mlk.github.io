import { config } from '../config';
import { getEmbeddedBase64Decoder } from '../utils/base64';

/**
 * Creates a unified proxy runtime script for direct rendering (no iframe).
 * Handles:
 * - Base64 decoding for fetch interceptor
 * - History API polyfill
 * - Navigation interception
 * - Fetch interception for GitHub content
 */
export function createProxyRuntimeScript(token: string): string {
  return `
(function() {
  'use strict';

  // Base64 decoder
  ${getEmbeddedBase64Decoder()}

  // History API polyfill
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(state, title, url) {
    try {
      return originalPushState.call(history, state, title, url);
    } catch (e) {
      console.log('pushState blocked:', e.message);
    }
  };

  history.replaceState = function(state, title, url) {
    try {
      return originalReplaceState.call(history, state, title, url);
    } catch (e) {
      console.log('replaceState blocked:', e.message);
    }
  };

  // Navigation interceptor
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link || !link.href) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('javascript:')) {
      return;
    }

    if (!href.startsWith('#')) {
      e.preventDefault();
      window.location.hash = href.startsWith('/') ? href : '/' + href;
    }
  }, true);

  // Fetch interceptor
  const originalFetch = window.fetch;

  function getContentType(path) {
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
    if (path.endsWith('.png')) return 'image/png';
    return 'application/json';
  }

  window.fetch = async function(url, options) {
    if (typeof url !== 'string' || !(url.includes('/data/') || url.includes('/ml/') || url.includes('/images/'))) {
      return originalFetch(url, options);
    }

    const path = url.replace(/^.*?\\/(?:medical-flow\\/)?/, '');
    const isImage = path.startsWith('images/');
    const contentsUrl = '${config.api.baseUrl}/repos/${config.repository.owner}/${config.repository.name}/contents/' + path + '?ref=${config.repository.branch}';

    const response = await originalFetch(contentsUrl, {
      ...options,
      headers: {
        ...options?.headers,
        'Authorization': 'Bearer ${token}',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) return response;

    const data = await response.json();
    let base64Content = data.content;

    if (data.encoding === 'none' || !base64Content) {
      const blobUrl = '${config.api.baseUrl}/repos/${config.repository.owner}/${config.repository.name}/git/blobs/' + data.sha;
      const blobResponse = await originalFetch(blobUrl, {
        headers: {
          'Authorization': 'Bearer ${token}',
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!blobResponse.ok) return blobResponse;

      const blobData = await blobResponse.json();
      base64Content = blobData.content;
    }

    const bytes = decodeBase64(base64Content);
    const content = isImage ? bytes : new TextDecoder('utf-8').decode(bytes);

    return new Response(content, {
      status: 200,
      headers: { 'Content-Type': getContentType(path) }
    });
  };
})();
  `.trim();
}

/**
 * Injects the unified proxy runtime script into the document head.
 */
export function injectProxyScripts(doc: Document, token: string): void {
  const script = doc.createElement('script');
  script.textContent = createProxyRuntimeScript(token);
  doc.head.insertBefore(script, doc.head.firstChild);
}
