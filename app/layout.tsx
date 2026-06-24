import type { Metadata } from 'next';
import { CONFIG } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  title: `${CONFIG.WORKSHOP_TITLE} — Live Leaderboard`,
  description: `Skore skills workshop dashboard for ${CONFIG.WORKSHOP_SUBTITLE}`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Serif:wght@300;400&display=optional"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
