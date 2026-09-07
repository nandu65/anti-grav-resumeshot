export interface FontOption {
  label: string;
  value: string;
  category: "sans-serif" | "serif" | "monospace";
  docxFont: string;
}

export const RESUME_FONTS: FontOption[] = [
  // Modern Sans-Serif
  { label: "Arial", value: "Arial, Helvetica, sans-serif", category: "sans-serif", docxFont: "Arial" },
  { label: "Inter", value: "'Inter', sans-serif", category: "sans-serif", docxFont: "Calibri" },
  { label: "Poppins", value: "'Poppins', sans-serif", category: "sans-serif", docxFont: "Calibri" },
  { label: "Quicksand", value: "'Quicksand', sans-serif", category: "sans-serif", docxFont: "Century Gothic" },
  { label: "Public Sans", value: "'Public Sans', sans-serif", category: "sans-serif", docxFont: "Arial" },
  { label: "Karla", value: "'Karla', sans-serif", category: "sans-serif", docxFont: "Calibri" },
  { label: "Rubik", value: "'Rubik', sans-serif", category: "sans-serif", docxFont: "Calibri" },
  { label: "Century Gothic", value: "'Century Gothic', CenturyGothic, AppleGothic, sans-serif", category: "sans-serif", docxFont: "Century Gothic" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif", category: "sans-serif", docxFont: "Tahoma" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', 'Lucida Sans Unicode', sans-serif", category: "sans-serif", docxFont: "Trebuchet MS" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif", category: "sans-serif", docxFont: "Verdana" },

  // Elegant Serif
  { label: "Times New Roman", value: "'Times New Roman', Times, serif", category: "serif", docxFont: "Times New Roman" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif", category: "serif", docxFont: "Georgia" },
  { label: "Bodoni MT", value: "'Bodoni MT', 'Bodoni Moda', Didot, Georgia, serif", category: "serif", docxFont: "Bodoni MT" },
  { label: "Palatino Linotype", value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif", category: "serif", docxFont: "Palatino Linotype" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif", category: "serif", docxFont: "Georgia" },
  { label: "Forum", value: "'Forum', Georgia, serif", category: "serif", docxFont: "Georgia" },
  { label: "Noto Serif", value: "'Noto Serif', Georgia, serif", category: "serif", docxFont: "Georgia" },
  { label: "Fraunces", value: "'Fraunces', Georgia, serif", category: "serif", docxFont: "Georgia" },

  // Monospace
  { label: "Courier New", value: "'Courier New', Courier, monospace", category: "monospace", docxFont: "Courier New" },
];
