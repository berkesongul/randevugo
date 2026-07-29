import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TenantProvider } from "@/contexts/TenantProvider";
import "./globals.css";
import IntroScreen from '@/components/IntroScreen/IntroScreen';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ),
  title: {
    default: 'Randevigo | Randevunu Kolayca Planla',
    template: '%s | Randevigo',
  },
  description:
    'Yakınındaki işletmeleri keşfet, hizmetini seç ve randevunu birkaç adımda planla.',
  openGraph: {
    title: 'Randevigo',
    description: 'Randevunu kolayca planla.',
    type: 'website',
    locale: 'tr_TR',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Randevigo randevu platformu' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Randevigo',
    description: 'Randevunu kolayca planla.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={inter.variable}>
      <body>
        <TenantProvider>
          <IntroScreen />
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
