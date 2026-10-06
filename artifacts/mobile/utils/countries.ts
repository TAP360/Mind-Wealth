import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import ar from "i18n-iso-countries/langs/ar.json";
import type { Language } from "@/localization/preferences";

export type { CountryCode };
countries.registerLocale(en);
countries.registerLocale(ar);
const regions = getCountries();
const callingCodes = [...new Set(regions.map((country) => getCountryCallingCode(country)))].sort((a, b) => b.length - a.length);

export function getCountryOptions(language: Language) {
  return regions.map((country) => ({
    country,
    name: countries.getName(country, language) ?? country,
    callingCode: `+${getCountryCallingCode(country)}`,
  })).sort((a, b) => a.name.localeCompare(b.name, language));
}

export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit.charCodeAt(0) >= 0x06f0 ? 0x06f0 : 0x0660)));
}

export function isCallingCode(value: string): boolean {
  return callingCodes.includes(value.replace(/^\+/, ""));
}

/** Split explicit international prefixes while typing; don't guess short local numbers. */
export function splitInternationalInput(value: string, selected: CountryCode) {
  const trimmed = normalizeDigits(value.trim());
  if (!/^[+\d\s()-]*$/.test(trimmed)) return { identifier: value };
  const compact = trimmed.replace(/[\s()-]/g, "");
  let international: string | undefined;
  if (compact.startsWith("+")) international = compact.slice(1);
  else if (compact.startsWith("00")) international = compact.slice(2);
  else if (compact.length >= 8) {
    const full = parsePhoneNumberFromString(`+${compact}`);
    const local = parsePhoneNumberFromString(compact, selected);
    if (full?.isValid() && (
      !local?.isPossible() ||
      (local.number === full.number && compact === `${full.countryCallingCode}${full.nationalNumber}`)
    )) international = compact;
  }
  if (!international) return { identifier: value };
  const code = callingCodes.find((prefix) => international!.startsWith(prefix));
  if (!code) return { identifier: value };
  const parsed = parsePhoneNumberFromString(`+${international}`);
  const preferred: Record<string, CountryCode> = { "1": "US", "7": "RU", "44": "GB", "358": "FI" };
  const country = parsed?.country ??
    (getCountryCallingCode(selected) === code ? selected : preferred[code] ?? regions.find((region) => getCountryCallingCode(region) === code)!);
  return { identifier: international.slice(code.length), countryCode: `+${code}`, country };
}
