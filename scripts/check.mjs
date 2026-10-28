// The editor checklist as a test. Fails (exit 1) on anything that would break under nysfocus.com/interactives/<slug>/
// or that the newsroom's rules forbid. Usage: node scripts/check.mjs [site dir] [interactive.json]
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { htmlFiles, pages, pageUrl, config } from "./pages.mjs";

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

for (const f of pages(dir)) {
  const html = read(f), want = pageUrl(cfg.slug, f);
  // 3. Canonical and social addresses on nysfocus.com.
  const canon = [...html.matchAll(/<link\b[^>]*>/gi)].map((t) => t[0]).find((t) => /rel\s*=\s*["']canonical["']/i.test(t));
  if (!canon) fail(f, "no <link rel=\"canonical\">");
  else if (attr(canon, "href") !== want) fail(f, `canonical is ${attr(canon, "href")}, expected ${want}`);
  const og = [...html.matchAll(/<meta\b[^>]*>/gi)].map((t) => t[0]).find((t) => /property\s*=\s*["']og:url["']/i.test(t));
  if (!og) fail(f, "no og:url");
  else if (attr(og, "content") !== want) fail(f, `og:url is ${attr(og, "content")}, expected ${want}`);
  for (const m of html.matchAll(/https?:\/\/[a-z0-9.-]+\.(?:pages\.dev|github\.io|workers\.dev)[^"'\s<]*/gi)) fail(f, `links to ${m[0]}`);
  // Analytics: the same Plausible site and Tag Manager container as nysfocus.com, so readers are counted.
  if (!/<script\b[^>]*data-domain=["']nysfocus\.com["'][^>]*src=["']https:\/\/stats\.gridwork\.co\/js\/script[^"']*\.js["']/i.test(html)) fail(f, "missing the Plausible script (data-domain=\"nysfocus.com\")");
  if (!html.includes("GTM-5GLGNHCQ")) fail(f, "missing the Google Tag Manager snippet (GTM-5GLGNHCQ)");
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
