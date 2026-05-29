import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PanelPage() {
  const session = await auth();

  // Oturum yoksa giris sayfasina gonder (gecici koruma; ilerleyen adimda
  // bunu middleware ile merkezilestirecegiz).
  if (!session?.user) {
    redirect("/giris");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 p-4">
      <h1 className="text-2xl font-bold text-gray-900">Panel</h1>
      <p className="text-gray-600">
        Hos geldin, <strong>{session.user.name}</strong>
      </p>
      <p className="text-sm text-gray-500">
        Rol: <span className="font-medium text-green-600">{session.user.role}</span>
      </p>
    </main>
  );
}
