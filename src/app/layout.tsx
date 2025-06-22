import type { Metadata, Viewport } from 'next';
import { Raleway } from 'next/font/google';
import './globals.css';

const font = Raleway({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Watchrr',
  authors: {
    name: 'Zach Lang',
    url: 'https://github.com/zendamacf/',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={font.className}>
      <body>{children}</body>
    </html>
  );
}
