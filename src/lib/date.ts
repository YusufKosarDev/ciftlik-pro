// Formats a Date as "YYYY-MM-DD" for input[type=date].
// toISOString() converts to UTC, which could shift the day for dates stored near
// midnight in the local time zone; the local date components
// (getFullYear/getMonth/getDate) are used instead.
export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
