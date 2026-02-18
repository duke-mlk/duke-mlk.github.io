import { stripAssetPathPrefix } from '../utils/paths';
import { injectProxyScripts } from './proxyScripts';

export interface HtmlProcessingOptions {
  token: string;
  fetchContent: (path: string) => Promise<string>;
}

interface InlineRule {
  selector: string;
  srcAttr: string;
  createReplacement: (doc: Document, content: string, original: Element) => Element;
}

const inlineRules: InlineRule[] = [
  {
    selector: 'script[src]',
    srcAttr: 'src',
    createReplacement(doc, content, original) {
      const el = doc.createElement('script');
      const type = original.getAttribute('type');
      if (type) el.setAttribute('type', type);
      el.textContent = content;
      return el;
    }
  },
  {
    selector: 'link[rel="stylesheet"][href]',
    srcAttr: 'href',
    createReplacement(doc, content) {
      const el = doc.createElement('style');
      el.textContent = content;
      return el;
    }
  }
];

async function inlineExternalResources(
  doc: Document,
  fetchContent: (path: string) => Promise<string>
): Promise<void> {
  for (const rule of inlineRules) {
    const elements = doc.querySelectorAll(rule.selector);
    for (const el of elements) {
      const src = el.getAttribute(rule.srcAttr);
      if (!src || src.startsWith('http')) continue;

      const content = await fetchContent(stripAssetPathPrefix(src));
      el.replaceWith(rule.createReplacement(doc, content, el));
    }
  }
}

/**
 * Parses HTML, inlines scripts/stylesheets, injects proxy runtime,
 * and returns the full HTML document string.
 */
export async function processProxyHtml(
  html: string,
  options: HtmlProcessingOptions
): Promise<string> {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  await inlineExternalResources(doc, options.fetchContent);
  injectProxyScripts(doc, options.token);

  return doc.documentElement.outerHTML;
}
