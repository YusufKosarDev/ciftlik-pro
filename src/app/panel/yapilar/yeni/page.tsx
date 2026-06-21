import Link from "next/link";
import { StructureForm } from "@/components/structure-form";
import { requirePageWrite } from "@/lib/authz";
import { getTranslations } from "next-intl/server";

export default async function YeniYapiPage() {
  await requirePageWrite("structures");
  const t = await getTranslations("Structures");
  const tc = await getTranslations("Common");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("new")}</h1>
        <Link href="/panel/yapilar" className="text-sm text-muted-foreground hover:underline">
          &larr; {tc("backToList")}
        </Link>
      </div>

      <StructureForm />
    </div>
  );
}
