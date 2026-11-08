'use client';

import { ActionIcon, Card, createTheme, Loader, LoadingOverlay, Modal, Paper } from '@mantine/core';

export default createTheme({
  cursorType: 'pointer',
  primaryColor: 'signal',
  primaryShade: { light: 7, dark: 6 },
  defaultRadius: 'md',
  fontFamily: 'var(--font-body), system-ui, sans-serif',
  headings: {
    fontFamily: 'var(--font-display), var(--font-body), system-ui, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '2.25rem', lineHeight: '1.15' },
      h2: { fontSize: '1.625rem', lineHeight: '1.2' },
      h3: { fontSize: '1.25rem', lineHeight: '1.3' },
      h4: { fontSize: '1.0625rem', lineHeight: '1.35' },
    },
  },
  colors: {
    // Brand: "signal" is the primary accent, "afterglow" marks watched/done.
    signal: [
      '#ffe9ed',
      '#ffd0d9',
      '#ffa8b7',
      '#ff8097',
      '#ff627d',
      '#ff4d6d', // Brand color
      '#f0405f',
      '#db3556',
      '#c02c4a',
      '#a02440',
    ],
    afterglow: [
      '#e3fbf7',
      '#c4f5ed',
      '#9cede0',
      '#74e3d3',
      '#52dac7',
      '#35d0ba', // Brand color
      '#22a08e',
      '#1b8777',
      '#176f62',
      '#10574d',
    ],
    // Dark scheme surfaces: dark[7] is the page ("night"), dark[6] is cards ("dusk").
    dark: [
      '#c9c5d6',
      '#aba6bd',
      '#8d87a3',
      '#716a89',
      '#4f4968',
      '#352f4b',
      '#211c31',
      '#15121f',
      '#100e18',
      '#0a0810',
    ],
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
      '#ffe5e1',
      '#ffc9c1',
      '#ffa597',
      '#fb8070',
      '#f2604d',
      '#e84a36',
      '#de3a28',
      '#d92d20', // Theme color
      '#bf2418',
      '#9f1d13',
    ],
  },
  components: {
    Card: Card.extend({ defaultProps: { radius: 'lg' } }),
    Paper: Paper.extend({ defaultProps: { radius: 'lg' } }),
    Modal: Modal.extend({ defaultProps: { radius: 'lg' } }),
    ActionIcon: ActionIcon.extend({
      defaultProps: { loaderProps: { type: 'dots' } },
    }),
    Loader: Loader.extend({
      defaultProps: { type: 'dots' },
    }),
    LoadingOverlay: LoadingOverlay.extend({
      defaultProps: { loaderProps: { type: 'dots' } },
    }),
  },
});
