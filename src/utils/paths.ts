/**
 * Strips leading slashes from an asset path.
 */
export function stripAssetPathPrefix(path: string): string {
  return path.replace(/^\/+/, '');
}
