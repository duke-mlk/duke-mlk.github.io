import { stripAssetPathPrefix } from '../utils/paths';
import { injectProxyScripts } from './proxyScripts';

export interface HtmlProcessingOptions {
  token: string;
  fetchContent: (path: string) => Promise<string>;
}

export interface ProcessedHtml {
  fullHtml: string;
}

/**
 * Inlines external scripts into the document.
 * Skips absolute URLs (http/https).
 */
async function inlineScripts(doc: Document, fetchContent: (path: string) => Promise<string>): Promise<void> {
  const scripts = doc.querySelectorAll('script[src]');

  for (const script of scripts) {
    const src = script.getAttribute('src');
    if (!src || src.startsWith('http')) continue;

    try {
      const strippedPath = stripAssetPathPrefix(src);
      const content = await fetchContent(strippedPath);
      const inlineScript = doc.createElement('script');
      const scriptType = script.getAttribute('type');
      if (scriptType) {
        inlineScript.setAttribute('type', scriptType);
      }
      inlineScript.textContent = content;
      script.replaceWith(inlineScript);
    } catch (err) {
      console.error(`Failed to inline script ${src}:`, err);
      throw err;
    }
  }
}

/**
 * Inlines external stylesheets into the document.
 * Skips absolute URLs (http/https).
 */
async function inlineStylesheets(doc: Document, fetchContent: (path: string) => Promise<string>): Promise<void> {
  const links = doc.querySelectorAll('link[rel="stylesheet"][href]');

  for (const link of links) {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http')) continue;

    try {
      const strippedPath = stripAssetPathPrefix(href);
      const content = await fetchContent(strippedPath);
      const style = doc.createElement('style');
      style.textContent = content;
      link.replaceWith(style);
    } catch (err) {
      console.error(`Failed to inline stylesheet ${href}:`, err);
      throw err;
    }
  }
}

/**
 * Processes HTML for blob URL rendering.
 * Pipeline:
 * 1. Parse HTML with DOMParser
 * 2. Inline scripts
 * 3. Inline stylesheets
 * 4. Inject proxy scripts
 * 5. Return full HTML document
 */
export async function processProxyHtml(
  html: string,
  options: HtmlProcessingOptions
): Promise<ProcessedHtml> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  await inlineScripts(doc, options.fetchContent);
  await inlineStylesheets(doc, options.fetchContent);
  injectProxyScripts(doc, options.token);

  return {
    fullHtml: doc.documentElement.outerHTML
  };
}
