// The shared New York Focus <head> tags on every page, from brand/head.html: Wisepops (the popups on nysfocus.com), the
// site's icons, the social tags that are the same on every page, and a font preconnect. Part of npm run build:
//   node scripts/head.mjs [site dir]
// Page-specific tags (title, description, canonical, og:url, og:image and its alt text) stay in each page.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { htmlFiles } from "./pages.mjs";

const START = "<!-- nyf-head: shared New York Focus tags, from brand/head.html by npm run build. Don't edit here. -->";
const END = "<!-- /nyf-head -->";

export function block() {
  return `${START}\n${readFileSync("brand/head.html", "utf8").trim()}\n${END}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {   // run as a command, not imported
  const dir = process.argv[2] || "site";
  const b = block(), re = new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END}`);
  let n = 0;
  for (const f of htmlFiles(dir)) {
    const path = `${dir}/${f}`, html = readFileSync(path, "utf8");
    const out = re.test(html) ? html.replace(re, () => b) : html.replace(/<\/head>/i, () => `${b}\n</head>`);
    if (out === html && !html.includes(b)) throw new Error(`${path}: no </head> to put the shared tags before`);
    if (out !== html) writeFileSync(path, out);
    n++;
  }
  console.log(`head: shared tags on ${n} page(s)`);
}
