/**
 * Strips path prefix from asset paths.
 * Handles both /medical-flow/assets/foo.js and /assets/foo.js.
 */
export function stripAssetPathPrefix(path: string): string {
  return path.replace(/^\/?(?:medical-flow\/)?/, '');
}
