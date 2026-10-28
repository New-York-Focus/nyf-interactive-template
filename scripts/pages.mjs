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

// Pages are folders: "index.html" and "county/erie/index.html". 404.html is not a page.
export const pages = (dir) => htmlFiles(dir).filter((f) => f === "index.html" || f.endsWith("/index.html"))
  .sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));

export const pageUrl = (slug, file) => BASE + slug + "/" + file.replace(/index\.html$/, "");
