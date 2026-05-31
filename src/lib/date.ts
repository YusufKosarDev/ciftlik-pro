// Date'i input[type=date] icin "YYYY-MM-DD" formatina cevirir.
// toISOString() UTC'ye cevirdigi icin yerel saat diliminde gece yarisina
// yakin saklanmis tarihlerde gun kayabiliyordu; bu yuzden yerel tarih
// bilesenlerini (getFullYear/getMonth/getDate) kullaniyoruz.
export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
