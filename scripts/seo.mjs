// Search and link-card standards, used by check.mjs: how wide a title or description is in Google's results, and the
// size of a link-card image.
import { readFileSync } from "node:fs";
import { UNITS_PER_EM, WIDTHS } from "./arial-widths.mjs";

// Google shows titles in 20px Arial and descriptions in 14px Arial (desktop), and cuts them off past these widths.
export const TITLE = { px: 20, max: 580 };
export const DESCRIPTION = { px: 14, max: 920 };
// Link cards: 1200x630 (1.91:1) is what Facebook, LinkedIn and X show without cropping; X refuses images over 5 MB.
export const IMAGE = { width: 1200, height: 630, maxBytes: 5 * 1024 * 1024 };

const FALLBACK = WIDTHS[0x4e];   // a character not in the table counts as "N", wider than most

// Width in pixels of text in Arial at the given size.
export function width(text, px) {
  let units = 0;
  for (const ch of text) units += WIDTHS[ch.codePointAt(0)] ?? FALLBACK;
  return Math.round((units / UNITS_PER_EM) * px);
}

// HTML attribute and text values as the reader sees them.
export const decode = (s) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

// Pixel size of a PNG or JPEG file, or null if it is neither.
export function imageSize(path) {
  const b = readFileSync(path);
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { type: "png", width: b.readUInt32BE(16), height: b.readUInt32BE(20), bytes: b.length };
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 9 < b.length;) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1], len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
        return { type: "jpeg", width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5), bytes: b.length };
      i += 2 + len;
    }
  }
  return null;
}
