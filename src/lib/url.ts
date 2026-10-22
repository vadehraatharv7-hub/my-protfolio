// Base-path aware URL helpers (the site is served under /my-protfolio/ on GitHub Pages).
const SITE_FALLBACK = 'https://atharvvadehra.dev';
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Site-relative path -> path including the configured base. Always ends with "/" unless it has a file extension or hash. */
export function path(p = '/'): string {
  const clean = p.startsWith('/') ? p : `/${p}`;
  return `${BASE}${clean}`;
}

/** Site-relative path -> absolute URL. */
export function abs(p = '/'): string {
  return new URL(path(p), import.meta.env.SITE || SITE_FALLBACK).toString();
}
