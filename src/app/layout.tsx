import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_DESCRIPTION =
  "Hayvan, tarla, stok, finans ve görevleri rol bazlı yetkilendirmeyle tek panelden yöneten tam yığın Çiftlik Yönetim Sistemi (ERP).";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Çiftlik Pro — Çiftlik Yönetim Sistemi",
    template: "%s · Çiftlik Pro",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Çiftlik Pro",
  manifest: "/manifest.json",
  openGraph: {
    title: "Çiftlik Pro — Çiftlik Yönetim Sistemi",
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "tr_TR",
    siteName: "Çiftlik Pro",
  },
  twitter: {
    card: "summary_large_image",
    title: "Çiftlik Pro — Çiftlik Yönetim Sistemi",
    description: SITE_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {children}
            <PwaRegister />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
