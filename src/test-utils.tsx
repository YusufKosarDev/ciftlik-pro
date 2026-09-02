/** Test helpers: render wrapped in the i18n (next-intl) provider. */
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../messages/tr.json";

// Renders components wrapped in the default (TR) message catalogue. Components
// using useTranslations throw in a test without a provider; this helper solves
// that.
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
