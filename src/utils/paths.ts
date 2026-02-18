/**
 * Strips the /medical-flow/ prefix from asset paths.
 * The gh-pages content is built with base: '/medical-flow/' so all
 * asset references start with that prefix, but in the repo they're at the root.
 */
export function stripAssetPathPrefix(path: string): string {
  return path.replace(/^\/?medical-flow\//, '');
}
