export const FONT_OPTIONS = [
  { value: "Playfair Display", label: "Playfair Display", css: '"Playfair Display", Georgia, serif' },
  { value: "Lora", label: "Lora", css: "Lora, Georgia, serif" },
  { value: "Merriweather", label: "Merriweather", css: "Merriweather, Georgia, serif" },
  { value: "Libre Baskerville", label: "Libre Baskerville", css: '"Libre Baskerville", Georgia, serif' },
  { value: "Source Serif 4", label: "Source Serif 4", css: '"Source Serif 4", Georgia, serif' },
  { value: "EB Garamond", label: "EB Garamond", css: '"EB Garamond", Georgia, serif' },
  { value: "Literata", label: "Literata", css: 'Literata, Georgia, serif' },
  { value: "Spectral", label: "Spectral", css: 'Spectral, Georgia, serif' },
  { value: "Cormorant Garamond", label: "Cormorant Garamond", css: '"Cormorant Garamond", Georgia, serif' },
  { value: "Newsreader", label: "Newsreader", css: 'Newsreader, Georgia, serif' },
  { value: "Crimson Pro", label: "Crimson Pro", css: '"Crimson Pro", Georgia, serif' },
  { value: "Cardo", label: "Cardo", css: 'Cardo, Georgia, serif' },
  { value: "Fraunces", label: "Fraunces", css: 'Fraunces, Georgia, serif' },
  { value: "Instrument Sans", label: "Instrument Sans", css: '"Instrument Sans", Arial, sans-serif' },
] as const;

export type EditorFont = (typeof FONT_OPTIONS)[number]["value"];
export const DEFAULT_EDITOR_FONT: EditorFont = "Playfair Display";

export function fontCss(font: string | undefined) {
  return FONT_OPTIONS.find((option) => option.value === font)?.css ?? FONT_OPTIONS[0].css;
}

export function resolveFontValue(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_EDITOR_FONT;
  const normalized = raw.replace(/['"]/g, "").split(",")[0].trim();
  const match = FONT_OPTIONS.find(
    (option) =>
      option.value === normalized ||
      option.value === raw ||
      raw.includes(option.value),
  );
  return match?.value ?? DEFAULT_EDITOR_FONT;
}
