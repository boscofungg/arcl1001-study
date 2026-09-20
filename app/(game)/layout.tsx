import type { Metadata } from 'next';
import ThemeProvider from '@/components/theme-provider';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Field Journal (beta) · Stratum',
  description: 'Explore ARCL1001 through learning expeditions, recall practice and cited evidence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body><ThemeProvider>{children}</ThemeProvider></body></html>;
}
