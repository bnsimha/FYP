import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import Navigation from '@/components/layout/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Distributed Terrain Generator',
  description: 'Generate 3D terrain using distributed Perlin noise',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider 
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <Navigation />
        {children}
        </ThemeProvider>
          
      </body>
    </html>
  );
}