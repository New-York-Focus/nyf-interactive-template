// A plain 1200x630 link card for a new project, so its setup can be committed before its real link cards exist:
//   node scripts/card.mjs [file]   (npm run card:setup writes site/share.png)
// The card is the brand cream with the yellow rule along the bottom, and it's marked inside the file as a setup card:
// npm test warns while a page uses it, and npm run check:launch fails, so it never launches.
import { writeFileSync } from "node:fs";
import { deflateSync, crc32 } from "node:zlib";
import { pathToFileURL } from "node:url";

export const SETUP_MARK = "nyf-setup-card";
const W = 1200, H = 630, RULE = 14;
const CREAM = [0xfd, 0xf2, 0xdd], YELLOW = [0xf8, 0xbc, 0x47];   // --nyf-cream, --nyf-yellow in site/brand.css

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "latin1");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

export function setupCard() {
  const rows = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    const color = y >= H - RULE ? YELLOW : CREAM, row = y * (1 + W * 3);   // each row starts with filter byte 0
    for (let x = 0; x < W; x++) rows.set(color, row + 1 + x * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2;   // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("tEXt", Buffer.from(`Comment\0${SETUP_MARK}`, "latin1")),
    chunk("IDAT", deflateSync(rows, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {   // run as a command, not imported
  const file = process.argv[2] || "site/share.png";
  writeFileSync(file, setupCard());
  console.log(`card: wrote a setup card to ${file}; replace it with the project's own before launch`);
}
