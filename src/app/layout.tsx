
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import 'katex/dist/katex.min.css'; // Import KaTeX CSS
import { AuthProvider } from '@/contexts/auth-context';
import Header from '@/components/header';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ExplainMate AI',
  description: 'Get AI-powered explanations with ExplainMate AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased text-foreground bg-background flex flex-col min-h-screen`}>
        <AuthProvider>
          <Header />
          <div className="flex-grow">
            {children}
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
