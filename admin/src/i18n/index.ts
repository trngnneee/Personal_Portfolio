import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import vi from "./locales/vi";

export const SUPPORTED_LANGUAGES = ["vi", "en"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
const LANG_KEY = "portfolio-admin.lang";

function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "vi") return stored;
  } catch {
    // storage unavailable
  }
  return "vi";
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, vi: { translation: vi } },
  lng: initialLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false }, // React escapes
});

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(LANG_KEY, lng);
  } catch {
    // ignore
  }
});
document.documentElement.lang = i18n.language;

type EnumGroups = (typeof en)["enums"];

/** Label for a data enum value, e.g. enumLabel("projectCategory", "homelab"). */
export function enumLabel<G extends keyof EnumGroups>(group: G, value: string): string {
  return i18n.t(`enums.${group}.${value}` as never, { defaultValue: value });
}

/** Select options for an enum group, in the order given. */
export function enumOptions<G extends keyof EnumGroups>(group: G, values: readonly string[]) {
  return values.map((value) => ({ value, label: enumLabel(group, value) }));
}

export default i18n;
