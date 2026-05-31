import { redirect } from "next/navigation";

// Kok adres dogrudan panele yonlendirir.
// Giris yapilmamissa proxy (middleware) otomatik olarak /giris'e gonderir.
export default function Home() {
  redirect("/panel");
}
