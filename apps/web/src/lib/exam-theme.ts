// Presentation only: every exam and category is data, so colours are derived
// from the category name. A new category gets a stable colour automatically.

const ACCENTS = [
  "#1f5fbf", // blue
  "#6d3fc4", // violet
  "#0b7f74", // teal
  "#b6511a", // burnt orange
  "#a8306a", // magenta
  "#2f7d32", // green
  "#475a7a", // slate
  "#b3373b", // crimson
];

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

export function examAccent(category: string): string {
  return ACCENTS[hash(category.toLowerCase()) % ACCENTS.length];
}

export function monogram(shortCode: string | null | undefined, title: string): string {
  const source = (shortCode && shortCode.trim()) || title;
  const letters = source
    .split(/[\s\-–—/]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("");
  const compact = source.replace(/[^A-Za-z0-9]/g, "");
  const text = compact.length <= 4 ? compact : letters.length >= 2 ? letters : compact;
  return text.slice(0, 4).toUpperCase();
}

export function scoreTone(percentage: number): "good" | "warn" | "bad" {
  if (percentage >= 75) return "good";
  if (percentage >= 50) return "warn";
  return "bad";
}
