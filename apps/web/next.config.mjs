import { fileURLToPath } from 'node:url';

export default function config() {
  return {
    output: 'standalone',
    transpilePackages: ['@nexus/design'],
    experimental: { outputFileTracingRoot: fileURLToPath(new URL('../..', import.meta.url)) },
    async headers() {
      return [{ source: '/:path*', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'same-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(self), geolocation=(self), microphone=()' },
        { key: 'Content-Security-Policy', value: process.env.NODE_ENV === 'development'
          ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
          : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
      ] }];
    },
    async rewrites() {
      return [{ source: '/backend/:path*', destination: `${process.env.API_BASE_URL || 'http://127.0.0.1:8000'}/:path*` }];
    },
  };
}
