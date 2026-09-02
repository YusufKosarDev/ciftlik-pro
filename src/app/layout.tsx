import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
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

// Open Graph wants a full language tag, while the app's locales are bare ("tr").
const OG_LOCALES: Record<string, string> = { tr: "tr_TR", en: "en_US" };

// The root metadata follows the ACTIVE locale rather than being fixed in Turkish.
// Every screen and every API error message is already translated, so a page whose
// <title>, description and og:locale were always Turkish was the one remaining
// leak — and the one most visible from outside, since it is what a search result
// and a shared link preview show.
//
// This mirrors what the storefront routes already do (src/app/magaza/page.tsx and
// magaza/[slug]/page.tsx): resolve the request's locale, then read the strings
// through next-intl.
//
// `title.template` and `applicationName` stay untranslated on purpose — they carry
// the product name, which does not change with language.
//
// Also deliberately out of scope: src/app/opengraph-image.tsx. Its `alt` and the
// card it paints are static exports that cannot be resolved per request, and the
// card is brand artwork rather than prose.
export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("Meta"), getLocale()]);
  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: "%s · Çiftlik Pro",
    },
    description,
    applicationName: "Çiftlik Pro",
    manifest: "/manifest.json",
    openGraph: {
      title,
      description,
      type: "website",
      locale: OG_LOCALES[locale] ?? OG_LOCALES.tr,
      siteName: "Çiftlik Pro",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

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
