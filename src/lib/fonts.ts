export const FONT_OPTIONS = [
  { value: "Playfair Display", label: "Playfair Display", css: '"Playfair Display", Georgia, serif' },
  { value: "Lora", label: "Lora", css: 'Lora, Georgia, serif' },
  { value: "Merriweather", label: "Merriweather", css: 'Merriweather, Georgia, serif' },
  { value: "Libre Baskerville", label: "Libre Baskerville", css: '"Libre Baskerville", Georgia, serif' },
  { value: "Source Serif 4", label: "Source Serif 4", css: '"Source Serif 4", Georgia, serif' },
] as const;

export type EditorFont = (typeof FONT_OPTIONS)[number]["value"];
export const DEFAULT_EDITOR_FONT: EditorFont = "Playfair Display";

export function fontCss(font: string | undefined) {
  return FONT_OPTIONS.find((option) => option.value === font)?.css ?? FONT_OPTIONS[0].css;
}
