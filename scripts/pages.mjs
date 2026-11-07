// Shared by the build and the checks: which files are pages, and the nysfocus.com address of each.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const BASE = "https://nysfocus.com/interactives/";

export function config(path = "interactive.json") {
  const c = JSON.parse(readFileSync(path, "utf8"));
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(c.slug || "")) throw new Error("interactive.json: slug must be lowercase letters, digits and hyphens");
  return c;
}

// Every .html file under dir, as a path relative to dir with forward slashes.
export function htmlFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".html")) out.push(relative(dir, p).split(sep).join("/"));
    }
  };
  walk(dir);
  return out.sort();
}

// An embed: a chart or map made only to sit in an iframe in a nysfocus.com article (Kyle, 2026-11-07), marked
// <meta name="nyf-embed">. Not a page: no header, footer, shared head tags or analytics (the article around it has them,
// and counts the reader once), out of the sitemap and out of search (noindex). npm test checks each one for that.
export const EMBED = /<meta\s[^>]*name=["']nyf-embed["']/i;
export const isEmbed = (dir, f) => EMBED.test(readFileSync(join(dir, f), "utf8"));
export const embeds = (dir) => htmlFiles(dir).filter((f) => isEmbed(dir, f));

// Pages are folders: "index.html" and "county/erie/index.html". 404.html and embeds are not pages.
export const pages = (dir) => htmlFiles(dir).filter((f) => (f === "index.html" || f.endsWith("/index.html")) && !isEmbed(dir, f))
  .sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));

export const pageUrl = (slug, file) => BASE + slug + "/" + file.replace(/index\.html$/, "");
