import './globals.css';

export const metadata = {
  title: 'Tins Dump',
  description: 'A minimal, premium space to dump and track your drink tin collection.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
