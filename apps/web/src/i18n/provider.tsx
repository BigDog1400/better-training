"use client";

import { type ReactNode, useState } from "react";
import { IntlProvider } from "react-intl";

import enMessages from "./compiled-messages/en.json";
import esMessages from "./compiled-messages/es.json";

const messages: Record<string, Record<string, string>> = {
  en: enMessages,
  es: esMessages,
};

type Props = {
  children: ReactNode;
};

export function I18nProvider({ children }: Props) {
  const [locale, setLocale] = useState("es");

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      {children}
    </IntlProvider>
  );
}
