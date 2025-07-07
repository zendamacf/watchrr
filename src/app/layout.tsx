import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { ColorSchemeScript, createTheme, mantineHtmlProps, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import type { Metadata, Viewport } from 'next';
import { Raleway } from 'next/font/google';
import './globals.css';

const theme = createTheme({
  cursorType: 'pointer',
  primaryColor: 'green',
  colors: {
    blue: [
      '#b3deff',
      '#99d3ff',
      '#80c8ff',
      '#66bcff',
      '#4db1ff',
      '#33a6ff',
      '#1a9bff',
      '#0090ff', // Theme color
      '#0082e6',
      '#0073cc',
    ],
    green: [
      '#b3efcb',
      '#99e9ba',
      '#80e4a9',
      '#66de98',
      '#4dd987',
      '#33d375',
      '#1ace64',
      '#00c853', // Theme color
      '#00b44b',
      '#00a042',
    ],
    orange: [
      '#ffd0b9',
      '#ffc0a2',
      '#ffb08b',
      '#ffa074',
      '#ff905d',
      '#ff8145',
      '#ff712e',
      '#ff6117', // Theme color
      '#e65715',
      '#cc4e12',
    ],
    red: [
      '#ffb3c8',
      '#ff99b6',
      '#ff80a4',
      '#ff6691',
      '#ff4d7f',
      '#ff336d',
      '#ff1a5a',
      '#ff0048', // Theme color
      '#e60041',
      '#cc003a',
    ],
  },
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
        <MantineProvider theme={theme}>
          <Notifications />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
