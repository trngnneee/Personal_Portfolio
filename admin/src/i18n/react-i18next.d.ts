import "i18next";
import type en from "./locales/en";

// Typed t(): keys are checked against locales/en.ts.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
  }
}
