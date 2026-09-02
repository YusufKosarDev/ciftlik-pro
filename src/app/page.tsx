import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Wheat,
  ArrowRight,
  DatabaseZap,
  ShieldCheck,
  FlaskConical,
  Languages,
  Store,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { DemoRoleButtons } from "@/components/demo-role-buttons";
import { GITHUB_URL } from "@/lib/site";
import { GithubIcon } from "@/components/github-icon";
import { cn } from "@/lib/cn";

// The public landing page.
//
// This route used to be `redirect("/panel")`, which meant the live URL — the one
// on a CV, the one a reader clicks first — dropped a visitor straight onto a sign-
// in form with no explanation of what they had just opened and no route to the
// source. The demo role buttons made the RBAC claim visible once you were past
// that form; this page makes the product visible before it.
//
// Signed-in visitors are NOT redirected away. The proxy already sends them from
// /giris to /panel, so anyone who wants the dashboard is one click from it, and a
// landing page that refuses to render for its author is a page that never gets
// looked at again.

// Rendered at 1280x800 by scripts/showcase-images.mjs. The dimensions are written
// out so the browser reserves the box before the image arrives — this is what
// keeps CLS at 0, and it is also why these are plain <img> tags: next/image would
// make `sharp` a runtime dependency and falsify the reachability argument in the
// README's security section.
const SHOT_WIDTH = 1280;
const SHOT_HEIGHT = 800;

const SHOTS = [
  { file: "dashboard.webp", captionKey: "shotDashboard" },
  { file: "animal-detail.webp", captionKey: "shotAnimal" },
  { file: "store.webp", captionKey: "shotStore" },
] as const;

const HIGHLIGHTS = [
  { icon: DatabaseZap, key: "isolation" },
  { icon: ShieldCheck, key: "rbac" },
  { icon: FlaskConical, key: "tested" },
  { icon: Languages, key: "bilingual" },
] as const;

export default async function LandingPage() {
  const [t, locale] = await Promise.all([getTranslations("Landing"), getLocale()]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <span className="flex items-center gap-2 font-bold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white">
              <Wheat className="h-4 w-4" />
            </span>
            Çiftlik Pro
          </span>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
            >
              <GithubIcon className="h-4 w-4" />
              {/* Narrow screens get the icon alone, but the label stays in the
                  accessibility tree so the link is never announced as bare. */}
              <span className="sr-only sm:not-sr-only">{t("source")}</span>
            </a>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        {/* Hero */}
        <section className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
            {t("kicker")}
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/giris" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              {t("signIn")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/magaza"
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "gap-2")}
            >
              <Store className="h-4 w-4" aria-hidden />
              {t("storefront")}
            </Link>
          </div>
        </section>

        {/* Demo role picker — the RBAC claim, made clickable. */}
        <section className="mt-12 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">{t("demoTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("demoBody")}</p>
          <DemoRoleButtons className="mt-4 max-w-xl" />
          <p className="mt-3 text-xs text-muted-foreground">{t("demoHint")}</p>
        </section>

        {/* Screenshots */}
        <section className="mt-14 space-y-8">
          {SHOTS.map(({ file, captionKey }, index) => (
            <figure key={file}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/showcase/${locale}/${file}`}
                width={SHOT_WIDTH}
                height={SHOT_HEIGHT}
                // The first image is the largest contentful paint on this page, so
                // it is not deferred; the two below the fold are.
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                alt={t(captionKey)}
                className="w-full rounded-xl border border-border shadow-sm"
              />
              <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                {t(captionKey)}
              </figcaption>
            </figure>
          ))}
        </section>

        {/* What is worth a reviewer's attention */}
        <section className="mt-14">
          <h2 className="text-lg font-semibold text-foreground">{t("highlightsTitle")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {HIGHLIGHTS.map(({ icon: Icon, key }) => (
              <Card key={key} className="p-5">
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <Icon className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden />
                  {t(`${key}Title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`${key}Body`)}
                </p>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t.rich("readMore", {
              repo: (chunks) => (
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-green-700 underline-offset-4 hover:underline dark:text-green-400"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition hover:text-foreground"
          >
            <GithubIcon className="h-4 w-4" />
            {t("source")}
          </a>
          <Link href="/giris" className="transition hover:text-foreground">
            {t("signIn")}
          </Link>
          <Link href="/kayit" className="transition hover:text-foreground">
            {t("createFarm")}
          </Link>
          <Link href="/magaza" className="transition hover:text-foreground">
            {t("storefront")}
          </Link>
          <span className="ml-auto">{t("license")}</span>
        </div>
      </footer>
    </div>
  );
}
