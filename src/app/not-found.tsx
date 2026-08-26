import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MapPinOff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

// Ozel 404 sayfasi.
export default async function NotFound() {
  const t = await getTranslations("Errors");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
        <MapPinOff className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground">{t("notFound")}</p>
      <Link href="/panel" className={buttonVariants()}>
        {t("backToPanel")}
      </Link>
    </main>
  );
}
