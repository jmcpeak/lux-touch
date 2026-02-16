import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import ClientProvider from '@/components/ClientProvider';
import { ThemeRegistry } from '@/ThemeRegistry';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lux Touch - World Domination',
  description: 'A Risk-style world conquest game',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ClientProvider session={session}>
            <ThemeRegistry>{children}</ThemeRegistry>
          </ClientProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
