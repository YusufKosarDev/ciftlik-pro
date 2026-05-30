import Link from "next/link";
import { FieldForm } from "@/components/field-form";

export default function YeniTarlaPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Yeni Tarla</h1>
        <Link href="/panel/tarlalar" className="text-sm text-gray-500 hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <FieldForm />
    </div>
  );
}
