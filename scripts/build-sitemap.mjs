// Writes site/sitemap.xml: every page (each index.html under site/, except 404.html) by its nysfocus.com address.
// Run by `npm run build`, so the sitemap can never drift from the pages.
import { writeFileSync } from "node:fs";
import { pages, pageUrl, config } from "./pages.mjs";

const dir = process.argv[2] || "site";
const { slug } = config(process.argv[3]);
const urls = pages(dir).map((p) => `  <url><loc>${pageUrl(slug, p)}</loc></url>`);
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join("\n") + "\n</urlset>\n";
writeFileSync(`${dir}/sitemap.xml`, xml);
console.log(`sitemap.xml: ${urls.length} pages`);
