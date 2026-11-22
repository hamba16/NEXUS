import './globals.css';

export const metadata = {
  title: 'APEX NEXUS — Presidential Directive Intelligence',
  description: "Uganda's Executive Oversight & Presidential Directive Monitoring Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="demo-notice" role="note">
          <strong>Open access exhibition — Simulated operational data.</strong>{' '}
          Anyone can select a role. Legacy directive numbering and figures are unverified; this is not an official government record.
        </div>
        {children}
      </body>
    </html>
  );
}
