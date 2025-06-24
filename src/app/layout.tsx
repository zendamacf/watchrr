import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import '@mantine/core/styles.css';
import type { Metadata, Viewport } from 'next';
import { Raleway } from 'next/font/google';
import './globals.css';

const font = Raleway({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'watchrr',
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
    <html lang="en" className={font.className} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
