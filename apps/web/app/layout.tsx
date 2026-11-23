import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './product.css';
import '@fontsource-variable/fraunces/wght.css';
import '@fontsource-variable/public-sans/wght.css';
import webPackage from '../package.json';

export const metadata: Metadata = {
  title: { default: 'APEX NEXUS | Executive Oversight Platform', template: '%s | APEX NEXUS' },
  description: 'Executive Oversight Platform for directive reporting, review and decision tracking.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const buildDate = process.env.NEXUS_BUILD_DATE || '2026-11-23';
  return <html lang="en"><body>
    <a className="skip-link" href="#main">Skip to main content</a>
    <header className="site-header"><a className="brand" href="/" aria-label="APEX NEXUS home"><span className="brand-mark" aria-hidden="true">A</span><span>APEX NEXUS<small>Executive Oversight Platform</small></span></a><nav aria-label="Public information"><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav></header>
    {children}
    <footer className="site-footer">Version {webPackage.version} · {buildDate} · Pre-production review build</footer>
  </body></html>;
}
