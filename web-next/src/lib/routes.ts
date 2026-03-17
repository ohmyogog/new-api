const rawBaseUrl = import.meta.env.BASE_URL || '/';

function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export const appBasePath = normalizeBasePath(rawBaseUrl);

export function withBasePath(path: string): string {
  if (!path) {
    return appBasePath;
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (appBasePath === '/') {
    return normalizedPath;
  }
  return `${appBasePath}${normalizedPath}`;
}

export function toAbsoluteAppUrl(path: string): string {
  return new URL(withBasePath(path), window.location.origin).toString();
}
