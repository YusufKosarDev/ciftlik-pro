import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function PanelPage() {
  const session = await auth();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Panel</h1>
      <p className="text-gray-600">
        Hos geldin, <strong>{session?.user.name}</strong>.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/panel/hayvanlar"
          className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-green-400 hover:shadow-sm"
        >
          <h2 className="font-semibold text-gray-900">Hayvanlar</h2>
          <p className="mt-1 text-sm text-gray-500">
            Hayvan kayitlarini goruntule ve yonet.
          </p>
        </Link>
      </div>
    </div>
  );
}
