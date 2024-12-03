type Translations = { [locale: string]: { [key: string]: string } }

let _locale = "en"
let _translations: Translations = {}

export function setupL10N(locale: string, builtinTranslations: Translations) {
  _locale = locale
  _translations = builtinTranslations
}

export function t(
  key: string,
  args?: { [key: string]: string },
  locale?: string,
) {
  const template = _translations[locale ?? _locale]?.[key] ?? key

  if (args == null) return template

  return Object.entries(args).reduce(
    (str, [name, val]) => str.replaceAll(`\${${name}}`, val),
    template,
  )
}
