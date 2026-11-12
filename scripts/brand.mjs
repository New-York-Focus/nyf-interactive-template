// The New York Focus brand on every page, from nyf-brand (https://nysfocus.com/brand/), in the versions brand.json pins
// (2026-11-09, Kyle: one copy for every interactive, replacing brand/ and site/brand.* in each repo). Part of
// npm run build:   node scripts/brand.mjs [site dir]
// It reads the pinned versions from nysfocus.com once into .brand/ (a released version never changes), then on every page:
// - the shared <head> tags (icons, social) and the link to the header and footer's styles (site.css), before </head>;
// - the nysfocus.com header after <body> and its footer before </body>, each marked with its version
//   (data-nyf-site="N"), which the nyf-interactives router replaces with the current version as it serves the page;
// - every link to brand.css or brand.js (relative, or another version's) pointed at the pinned version's.
// An embed (pages.mjs) gets only the brand.css and brand.js links: no header, footer or shared tags (taken out if it had
// them). Not on the pages themselves: never edit what's between the nyf-head, nyf-header and nyf-footer comments.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { htmlFiles, isEmbed } from "./pages.mjs";

export const BRAND = "https://nysfocus.com/brand";
export const CACHE = ".brand";

// The versions this project pins: brand.json, { "brand": N, "site": N }. Taking a newer one: change the number, then
// npm test, and look at the PR's preview before merging.
export function pins(path = "brand.json") {
  if (!existsSync(path)) throw new Error(`${path} is missing: add { "brand": 1, "site": 1 } (the versions of nysfocus.com/brand/ this project uses)`);
  const p = JSON.parse(readFileSync(path, "utf8"));
  for (const k of ["brand", "site"]) if (!Number.isInteger(p[k]) || p[k] < 1) throw new Error(`${path}: "${k}" must be a version number, 1 or more`);
  return p;
}

export const brandUrl = (v, file) => `${BRAND}/v${v}/${file}`;
export const siteUrl = (v, file) => `${BRAND}/site/v${v}/${file}`;
const FILES = (p) => [[`brand-v${p.brand}/head.html`, brandUrl(p.brand, "head.html")],
  [`site-v${p.site}/header.html`, siteUrl(p.site, "header.html")], [`site-v${p.site}/footer.html`, siteUrl(p.site, "footer.html")]];

// nysfocus.com's firewall lets through a user agent with "nyf-" in it, for New York Focus's own tools
export const UA = "nyf-build (+https://github.com/New-York-Focus/nyf-interactive-template)";

async function get(url) {
  for (let i = 0; ; i++) {
    try {
      // Named as one of our tools: nysfocus.com's bot protection blocks Node's default client (2026-11-10)
      const r = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (e) {
      if (i) throw new Error(`can't read ${url}: ${e.message}`);
    }
  }
}

// Reads the pinned versions into .brand/ unless they're there already, and the newest versions (for the checks'
// warnings) every time, if nysfocus.com answers.
export async function fetchBrand(p = pins()) {
  for (const [file, url] of FILES(p)) {
    const path = `${CACHE}/${file}`;
    if (existsSync(path)) continue;
    const text = await get(url);
    mkdirSync(path.slice(0, path.lastIndexOf("/")), { recursive: true });
    writeFileSync(path, text);
  }
  try {
    const [brand, site] = await Promise.all([get(`${BRAND}/current.json`), get(`${BRAND}/site/current.json`)]);
    writeFileSync(`${CACHE}/current.json`, JSON.stringify({ brand: JSON.parse(brand).version, site: JSON.parse(site).version }) + "\n");
  } catch (e) {
    console.warn(`brand: couldn't read the newest versions (${e.message}); the pinned ones are used as they are`);
  }
}

// Cloudflare's bot detection adds a script of its own to every HTML file nysfocus.com serves, these included. Built into
// a page, it would run there with the ray ID of the build's request, alongside the fresh one Cloudflare adds as it serves
// the page: taken out, from copies cached before this too.
export const cfInjected = /<script>\(function\(\)\{function c\(\)\{[^<]*?__CF\$cv\$params[\s\S]*?<\/script>\n?/g;
const cached = (file) => {
  const path = `${CACHE}/${file}`;
  if (!existsSync(path)) throw new Error(`${path} is missing: run npm run build`);
  return readFileSync(path, "utf8").replace(cfInjected, "");
};

// The newest versions, as of the last build (null if nysfocus.com didn't answer).
export const newest = () => (existsSync(`${CACHE}/current.json`) ? JSON.parse(readFileSync(`${CACHE}/current.json`, "utf8")) : null);

const MARK = {
  head: ["<!-- nyf-head: shared New York Focus tags and the header and footer's styles, from nysfocus.com/brand/ (brand.json) by npm run build. Don't edit here. -->", "<!-- /nyf-head -->"],
  header: ["<!-- nyf-header: the nysfocus.com header, from nysfocus.com/brand/ (brand.json) by npm run build; the router keeps it current. Don't edit here. -->", "<!-- /nyf-header -->"],
  footer: ["<!-- nyf-footer: the nysfocus.com footer, from nysfocus.com/brand/ (brand.json) by npm run build; the router keeps it current. Don't edit here. -->", "<!-- /nyf-footer -->"],
};
// Any version of a block, this script's or the template's earlier ones (brand/ copied in by head.mjs and footer.mjs).
const BLOCK = {
  head: /<!-- nyf-head:[\s\S]*?<!-- \/nyf-head -->/,
  header: /<!-- nyf-header:[\s\S]*?<!-- \/nyf-header -->/,
  footer: /<!-- nyf-footer:[\s\S]*?<!-- \/nyf-footer -->/,
};

// The three blocks, exactly as they go on a page (the checks compare them).
export function blocks(p = pins()) {
  const css = `<link rel="stylesheet" href="${siteUrl(p.site, "site.css")}" data-nyf-site="${p.site}">`;
  const wrap = (name, inner) => `${MARK[name][0]}\n${inner.trim()}\n${MARK[name][1]}`;
  return {
    head: wrap("head", `${cached(`brand-v${p.brand}/head.html`).trim()}\n${css}`),
    header: wrap("header", cached(`site-v${p.site}/header.html`)),
    footer: wrap("footer", cached(`site-v${p.site}/footer.html`)),
  };
}

// Links to brand.css and brand.js: relative ("brand.css", "../../brand.css"), the project's own copy by its full address
// (404.html, served at any depth: "https://nysfocus.com/interactives/<slug>/brand.css") or any version's on nysfocus.com.
export const BRAND_LINK = /(\b(?:href|src)\s*=\s*["'])((?:\.{1,2}\/)*|https:\/\/nysfocus\.com\/(?:brand\/v\d+|interactives\/[a-z0-9-]+)\/)brand\.(css|js)(["'])/g;
export const pointBrandLinks = (html, p) => html.replace(BRAND_LINK, (_, a, __, ext, q) => `${a}${brandUrl(p.brand, `brand.${ext}`)}${q}`);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {   // run as a command, not imported
  const dir = process.argv[2] || "site";
  try {
    const p = pins();
    await fetchBrand(p);
    const b = blocks(p);
    let n = 0;
    for (const f of htmlFiles(dir)) {
      const path = `${dir}/${f}`, html = readFileSync(path, "utf8");
      let out = pointBrandLinks(html, p);
      if (isEmbed(dir, f)) {
        for (const re of Object.values(BLOCK)) out = out.replace(re, "");
      } else {
        out = BLOCK.head.test(out) ? out.replace(BLOCK.head, () => b.head) : out.replace(/<\/head>/i, () => `${b.head}\n</head>`);
        out = BLOCK.header.test(out) ? out.replace(BLOCK.header, () => b.header) : out.replace(/<body\b[^>]*>/i, (m) => `${m}\n${b.header}`);
        out = BLOCK.footer.test(out) ? out.replace(BLOCK.footer, () => b.footer) : out.replace(/<\/body>/i, () => `${b.footer}\n</body>`);
        for (const k of Object.keys(b)) if (!out.includes(b[k])) throw new Error(`${path}: no <head>, <body> and </body> to put the ${k} in`);
        n++;
      }
      if (out !== html) writeFileSync(path, out);
    }
    console.log(`brand: brand v${p.brand} and site v${p.site} on ${n} page(s)`);
  } catch (e) {
    console.error(`brand: ${e.message}`);
    process.exit(1);
  }
}
