export function buildApiUrl(baseUrl: string, path: string): string {
  const root = baseUrl.replace(/\/$/, '');
  return `${root}${path.startsWith('/') ? path : `/${path}`}`;
}
