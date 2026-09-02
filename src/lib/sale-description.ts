// Description for the income transaction a sale posts automatically.
//
// WHY IT LIVES HERE: both /api/sales and /api/sales/[id] write the linked INCOME
// transaction, and both must produce the same description — otherwise editing a
// sale would silently rewrite its transaction's wording. It used to be exported
// from the POST route and imported by the PATCH route, which made a route module
// double as a shared library.
//
// Next 16.3 rejects that outright: a route module may export only the HTTP
// handlers and a fixed set of config values, and any other export fails the build
// with "does not satisfy the constraint '{ [x: string]: never; }'". The layering
// was wrong before that check existed; the check only made it visible.
export function saleDescription(item: string, customer?: string | null): string {
  return customer ? `${item} — ${customer}` : item;
}
