import Link from "next/link";
import { StructureForm } from "@/components/structure-form";
import { requirePageWrite } from "@/lib/authz";

export default async function YeniYapiPage() {
  await requirePageWrite("structures");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Yeni Yapi</h1>
        <Link href="/panel/yapilar" className="text-sm text-gray-500 hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <StructureForm />
    </div>
  );
}
