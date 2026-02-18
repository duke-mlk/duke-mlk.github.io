export function decodeBase64Utf8(base64Content: string): string {
  const base64 = base64Content.replace(/\s/g, '');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

/** Returns a base64 decoder function as a string for injection into proxy HTML. */
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
