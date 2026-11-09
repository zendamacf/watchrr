import { getAppUrl } from '../config';

/**
 * Colors mirror the app theme (src/app/theme.ts, globals.css). Email clients can't
 * read CSS variables, so values are inlined; keep in sync with the theme.
 */
export const emailColors = {
  light: {
    page: '#f4f2f9',
    card: '#ffffff',
    text: '#15121f',
    muted: '#716a89',
    button: '#db3556',
    buttonText: '#ffffff',
  },
  dark: {
    page: '#100e18',
    card: '#211c31',
    text: '#f4f2f9',
    muted: '#aba6bd',
    button: '#f0405f',
    buttonText: '#ffffff',
  },
} as const;

export const FONT_STACK = "Figtree, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const DISPLAY_FONT_STACK = `'Bricolage Grotesque', ${FONT_STACK}`;

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Primary call-to-action button matching the app's primary (signal) color. */
export function renderButton(href: string, label: string): string {
  const c = emailColors.light;
  return `<a class="btn" href="${escapeHtml(href)}" style="display:inline-block;padding:12px 20px;background:${c.button};color:${c.buttonText};border-radius:8px;font-weight:600;text-decoration:none;">${escapeHtml(label)}</a>`;
}

/**
 * Shared HTML shell for all transactional emails: logo header, themed card, light and
 * dark mode (via prefers-color-scheme where the client supports it). `bodyHtml` must
 * already be escaped. Use the `.muted` class for secondary text.
 */
export function renderLayout(bodyHtml: string): string {
  const l = emailColors.light;
  const d = emailColors.dark;
  const appUrl = getAppUrl();
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700&family=Figtree:wght@400;600&display=swap" rel="stylesheet">
    <style>
      .logo-dark-mode { display: none; max-height: 0; overflow: hidden; }
      @media (prefers-color-scheme: dark) {
        .page { background: ${d.page} !important; }
        .card { background: ${d.card} !important; color: ${d.text} !important; }
        .muted { color: ${d.muted} !important; }
        .btn { background: ${d.button} !important; color: ${d.buttonText} !important; }
        .logo-light-mode { display: none !important; }
        .logo-dark-mode { display: block !important; max-height: none !important; }
      }
    </style>
  </head>
  <body class="page" style="margin:0;padding:24px 16px;background:${l.page};font-family:${FONT_STACK};">
    <div class="card" style="max-width:480px;margin:0 auto;background:${l.card};color:${l.text};border-radius:16px;padding:28px;font-size:16px;line-height:1.5;">
      <img class="logo-light-mode" src="${appUrl}/watchrr-dark.png" alt="watchrr" width="140" style="display:block;margin:0 0 24px;height:auto;">
      <img class="logo-dark-mode" src="${appUrl}/watchrr-light.png" alt="watchrr" width="140" style="margin:0 0 24px;height:auto;">
      ${bodyHtml}
    </div>
  </body>
</html>`;
}
