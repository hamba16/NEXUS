import './globals.css';
import '@fontsource-variable/fraunces/wght.css';
import '@fontsource-variable/public-sans/wght.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@nexus/design/src/styles/tokens.css';
import { comfortBootScript } from '@nexus/design';

export const metadata = {
  title: 'APEX NEXUS — Presidential Directive Intelligence',
  description: "Uganda's Executive Oversight & Presidential Directive Monitoring Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-UG" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: comfortBootScript }} />
      </head>
      <body>
        <aside className="demo-notice" role="region" aria-label="Open access data notice">
          <strong>Open access — Simulated operational data.</strong>{' '}
          Anyone can select a profile. No identity assurance. This is not an official government record.
        </aside>
        {children}
      </body>
    </html>
  );
}
