import Link from "next/link";
import { AnimalForm } from "@/components/animal-form";

export default function YeniHayvanPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Yeni Hayvan</h1>
        <Link href="/panel/hayvanlar" className="text-sm text-gray-500 hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <AnimalForm />
    </div>
  );
}
