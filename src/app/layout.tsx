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
  title: 'Randevigo | SaaS Appointment Booking',
  description: 'Multi-tenant abstract appointment reservation system.',
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
