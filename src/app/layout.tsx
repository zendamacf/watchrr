import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { QueryProvider } from '@/components/QueryProvider';
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import type { Metadata, Viewport } from 'next';
import { Raleway } from 'next/font/google';
import './globals.css';
import theme from './theme';

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
        <MantineProvider theme={theme}>
          <Notifications />
          <QueryProvider>
            <ModalsProvider>{children}</ModalsProvider>
          </QueryProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
