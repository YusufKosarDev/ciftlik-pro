import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

export default async function PanelPage() {
  const session = await auth();

  // Asil koruma middleware'de; bu ise ekstra guvenlik ve session verisine erisim icin.
  if (!session?.user) {
    redirect("/giris");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ust bar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <span className="text-lg font-bold text-green-700">Ciftlik Pro</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {session.user.name}{" "}
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {session.user.role}
            </span>
          </span>
          <LogoutButton />
        </div>
      </header>

      {/* Icerik */}
      <main className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Panel</h1>
        <p className="mt-2 text-gray-600">
          Hos geldin, <strong>{session.user.name}</strong>. Modulleri ilerleyen
          adimlarda buraya ekleyecegiz.
        </p>
      </main>
    </div>
  );
}
