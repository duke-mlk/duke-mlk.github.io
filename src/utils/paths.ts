export function stripAssetPathPrefix(path: string): string {
  return path.replace(/^\/?(?:medical-flow\/)?/, '');
}
