/**
 * Decodes base64 content to UTF-8 string.
 * Handles whitespace in base64 content and properly decodes multi-byte characters.
 */
export function decodeBase64Utf8(base64Content: string): string {
  const base64 = base64Content.replace(/\s/g, '');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Returns an embedded base64 decoder function as a string.
 * For injection into iframes where imports are not available.
 */
export function getEmbeddedBase64Decoder(): string {
  return `
    function decodeBase64(base64Content) {
      const base64 = base64Content.replace(/\\s/g, '');
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
  `.trim();
}
