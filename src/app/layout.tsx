import '@mantine/core/styles.css';

import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import type { ReactNode } from 'react';
import { UmamiAnalytics } from '@/components/analytics/UmamiAnalytics';
import './globals.css';
import theme from './theme';

const bodyFont = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
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
  viewportFit: 'cover',
};

const DEFAULT_COLOR_THEME = 'auto';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps} className={`${bodyFont.variable} ${displayFont.variable}`}>
      <head>
        <ColorSchemeScript defaultColorScheme={DEFAULT_COLOR_THEME} />
      </head>
      <body>
        <UmamiAnalytics />
        <MantineProvider theme={theme} defaultColorScheme={DEFAULT_COLOR_THEME}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
