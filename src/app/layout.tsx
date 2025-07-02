import '@mantine/core/styles.css';

import { ColorSchemeScript, createTheme, mantineHtmlProps, MantineProvider } from '@mantine/core';
import type { Metadata, Viewport } from 'next';
import { Raleway } from 'next/font/google';
import './globals.css';

const theme = createTheme({
  /** Put your mantine theme override here */
});

const font = Raleway({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'watchrr',
  authors: {
    name: 'Zach Lang',
    url: 'https://github.com/zendamacf/',
  },
  icons: {
    icon: '/favicon.ico',
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
    <html lang="en" {...mantineHtmlProps} className={font.className}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme}>{children}</MantineProvider>
      </body>
    </html>
  );
}
