import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ByteChat — Your Knowledge Base Assistant',
  description:
    'An intelligent chatbot that answers questions from your documentation using Retrieval-Augmented Generation (RAG).',
  openGraph: {
    title: 'ByteChat',
    description: 'Ask questions about your documentation and get instant, accurate answers.',
    type: 'website',
  },
};

import Navbar from './components/Navbar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body>
        <div className="app-shell">
          <Navbar />
          <main className="app-main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
