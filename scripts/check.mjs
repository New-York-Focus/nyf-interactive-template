// The editor checklist as a test. Fails (exit 1) on anything that would break under nysfocus.com/interactives/<slug>/
// or that the newsroom's rules forbid. Usage: node scripts/check.mjs [site dir] [interactive.json]
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { htmlFiles, pages, pageUrl, config } from "./pages.mjs";
import { block as footerBlock } from "./footer.mjs";
import { block as headBlock } from "./head.mjs";
import { TITLE, DESCRIPTION, IMAGE, width, decode, imageSize } from "./seo.mjs";

// The template's placeholder site/share.png: a launched project must replace it with its own.
const PLACEHOLDER_IMAGE = "6470030c5107f7f3ab059678f10b1a4fd8580d4a0f1742449b2ef1a89925949a";

const dir = process.argv[2] || "site";
const cfg = config(process.argv[3]);
const problems = [];
const fail = (file, msg) => problems.push(`${file}: ${msg}`);
const read = (f) => readFileSync(`${dir}/${f}`, "utf8");

// Scripts and styles may contain "/" in code; links in markup are what resolve against the folder.
const markup = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "");
const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i")) || [])[1];

for (const f of htmlFiles(dir)) {
  const html = read(f), body = markup(html);
  // 1. Relative links only.
  if (/<base\b/i.test(body)) fail(f, "has a <base> tag");
  for (const m of body.matchAll(/\b(href|src|action|poster|data)\s*=\s*["'](\/[^/"'][^"']*|\/)["']/gi)) fail(f, `${m[1]}="${m[2]}" starts with /`);
  for (const m of html.matchAll(/\bfetch\(\s*["'`](\/[^/][^"'`]*)/g)) fail(f, `fetch("${m[1]}") starts with /`);
  for (const m of html.matchAll(/url\(\s*["']?(\/[^/)"'][^)"']*)/g)) fail(f, `url(${m[1]}) starts with /`);
}

const titles = new Map(), descriptions = new Map();
for (const f of pages(dir)) {
  const html = read(f), want = pageUrl(cfg.slug, f);
  const head = html.slice(0, Math.max(0, html.search(/<\/head>/i)));   // <title> in an SVG in the body doesn't count
  const meta = (key, value) => [...head.matchAll(/<meta\b[^>]*>/gi)].map((t) => t[0])
    .find((t) => new RegExp(`\\b${key}\\s*=\\s*["']${value}["']`, "i").test(t));
  const content = (key, value) => { const t = meta(key, value); return t ? decode(attr(t, "content") || "") : ""; };
  // Search: a title and a description that fit in Google's results, different on every page.
  const title = decode((head.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "");
  if (!title) fail(f, "no <title> (the title in search results)");
  else if (width(title, TITLE.px) > TITLE.max) fail(f, `<title> is ${width(title, TITLE.px)}px wide in search results, over ${TITLE.max}px: "${title}"`);
  const desc = content("name", "description");
  if (!desc) fail(f, 'no <meta name="description"> (the summary in search results)');
  else if (width(desc, DESCRIPTION.px) > DESCRIPTION.max) fail(f, `meta description is ${width(desc, DESCRIPTION.px)}px wide in search results, over ${DESCRIPTION.max}px`);
  for (const [v, seen, what] of [[title, titles, "<title>"], [desc, descriptions, "meta description"]])
    if (v) { if (seen.has(v)) fail(f, `same ${what} as ${seen.get(v)}`); else seen.set(v, f); }
  // Link card: a 1200x630 PNG or JPEG in this project, described for people who can't see it.
  const image = content("property", "og:image");
  if (!image) fail(f, 'no <meta property="og:image"> (the link-card image)');
  else if (!image.startsWith(pageUrl(cfg.slug, ""))) fail(f, `og:image ${image} must be a file in this project, at ${pageUrl(cfg.slug, "")}…`);
  else {
    const file = `${dir}/${image.slice(pageUrl(cfg.slug, "").length)}`, size = existsSync(file) ? imageSize(file) : null;
    if (!existsSync(file)) fail(f, `og:image ${image}: no file ${file}`);
    else if (!size) fail(f, `og:image ${image} must be a PNG or JPEG`);
    else {
      if (size.width !== IMAGE.width || size.height !== IMAGE.height) fail(f, `og:image is ${size.width}x${size.height}; link cards need ${IMAGE.width}x${IMAGE.height}`);
      if (size.bytes > IMAGE.maxBytes) fail(f, `og:image is ${(size.bytes / 1048576).toFixed(1)} MB; keep it under 5 MB`);
      if (content("property", "og:image:width") !== String(size.width) || content("property", "og:image:height") !== String(size.height))
        fail(f, `og:image:width and og:image:height must be ${size.width} and ${size.height}`);
      if (cfg.slug !== "example-interactive" && createHash("sha256").update(readFileSync(file)).digest("hex") === PLACEHOLDER_IMAGE)
        fail(f, "og:image is still the template's placeholder; make a link-card image for this project");
    }
  }
  if (!content("property", "og:image:alt")) fail(f, 'no <meta property="og:image:alt"> describing the link-card image');
  if (content("name", "twitter:card") !== "summary_large_image") fail(f, '<meta name="twitter:card" content="summary_large_image"> missing (a large link card on X)');
  // 3. Canonical and social addresses on nysfocus.com.
  const canon = [...html.matchAll(/<link\b[^>]*>/gi)].map((t) => t[0]).find((t) => /rel\s*=\s*["']canonical["']/i.test(t));
  if (!canon) fail(f, "no <link rel=\"canonical\">");
  else if (attr(canon, "href") !== want) fail(f, `canonical is ${attr(canon, "href")}, expected ${want}`);
  const og = [...html.matchAll(/<meta\b[^>]*>/gi)].map((t) => t[0]).find((t) => /property\s*=\s*["']og:url["']/i.test(t));
  if (!og) fail(f, "no og:url");
  else if (attr(og, "content") !== want) fail(f, `og:url is ${attr(og, "content")}, expected ${want}`);
  for (const m of html.matchAll(/https?:\/\/[a-z0-9.-]+\.(?:pages\.dev|github\.io|workers\.dev)[^"'\s<]*/gi)) fail(f, `links to ${m[0]}`);
  // Analytics: the same Plausible site and Tag Manager container as nysfocus.com, so readers are counted.
  if (!/<script\b[^>]*data-domain=["']nysfocus\.com["'][^>]*src=["']https:\/\/stats\.gridwork\.co\/js\/script\.pageview-props\.js["'][^>]*event-category=["']Interactives["']/i.test(html)) fail(f, "missing the Plausible script (data-domain=\"nysfocus.com\", script.pageview-props.js, event-category=\"Interactives\")");
  if (!html.includes("GTM-5GLGNHCQ")) fail(f, "missing the Google Tag Manager snippet (GTM-5GLGNHCQ)");
  // Brand: the nysfocus.com font kit (the footer and brand.css need it).
  if (!html.includes('href="https://cloud.typography.com/14378/7423632/css/fonts.css"')) fail(f, "missing the font kit <link> (https://cloud.typography.com/14378/7423632/css/fonts.css)");
}

// The nysfocus.com footer and the shared <head> tags (Wisepops, icons, social), exactly as in brand/ (npm run build puts
// them there), on every page and 404.html.
const footer = footerBlock(), head = headBlock();
for (const f of htmlFiles(dir)) {
  const html = read(f);
  if (!html.includes(footer)) fail(f, "missing the nysfocus.com footer, or it was edited (run npm run build)");
  const i = html.indexOf(head);
  if (i < 0 || i > html.search(/<\/head>/i)) fail(f, "missing the shared <head> tags from brand/head.html, or they were edited (run npm run build)");
}

// 4. Sitemap lists exactly the pages.
if (!existsSync(`${dir}/sitemap.xml`)) fail("sitemap.xml", "missing (run npm run build)");
else {
  const listed = new Set([...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
  const expected = new Set(pages(dir).map((f) => pageUrl(cfg.slug, f)));
  for (const u of expected) if (!listed.has(u)) fail("sitemap.xml", `missing ${u}`);
  for (const u of listed) if (!expected.has(u)) fail("sitemap.xml", `lists ${u}, which is not a page`);
}

// pages.dev copies stay out of search; the nyf-interactives Worker removes this header on nysfocus.com.
if (!existsSync(`${dir}/_headers`) || !/^\/\*\s*\n\s+X-Robots-Tag:\s*noindex/im.test(read("_headers"))) fail("_headers", "must start with /* and X-Robots-Tag: noindex");
if (!existsSync(`${dir}/404.html`)) fail("404.html", "missing");

// 6. Static unless Kyle approved a Function (set "functions": true in interactive.json only after that approval).
const fnDirs = ["functions", `${dir}/functions`].filter((d) => existsSync(d) && readdirSync(d).length);
if (fnDirs.length && cfg.functions !== true) fail(fnDirs[0], "Functions need Kyle's approval first (then set \"functions\": true in interactive.json)");
for (const d of fnDirs) {
  const walk = (p) => readdirSync(p, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(`${p}/${e.name}`) : [`${p}/${e.name}`]);
  for (const f of walk(d).filter((f) => /\.(m?js|ts)$/.test(f))) {
    const src = readFileSync(f, "utf8");
    // Never log what readers type: no logging of the request, its URL or its query.
    for (const m of src.matchAll(/console\.\w+\(([^)]*)\)/g)) if (/request|url|searchParams|\bq\b|query|address|body/i.test(m[1])) fail(f, `logs reader input? ${m[0].slice(0, 80)}`);
    if (/onRequest(Post|Put|Patch|Delete)\b/.test(src)) fail(f, "Functions are GET only");
  }
}
// Secrets never go in the repo.
for (const f of htmlFiles(dir)) if (/(api[_-]?key|secret|token)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i.test(read(f))) fail(f, "looks like it contains a key or token");

if (problems.length) {
  console.error(`${problems.length} problem(s):\n` + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log(`check: ${pages(dir).length} pages OK for ${"https://nysfocus.com/interactives/" + cfg.slug + "/"}`);
