/** Test yardimcilari: i18n (next-intl) saglayicili render. */
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../messages/tr.json";

// Bilesenleri varsayilan (TR) mesaj katalogu ile sarip render eder. useTranslations
// kullanan bilesenler testte saglayici olmadan patlar; bu yardimci onu cozer.
export function renderWithIntl(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale="tr" messages={messages}>
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  });
}
