// The nysfocus.com header and footer on every page, kept the same as the website's.
//   node scripts/footer.mjs sync    fetch nysfocus.com and update brand/header.* and brand/footer.* (npm run footer:sync)
//   node scripts/footer.mjs check   exit 1 if the website's header or footer differs from brand/ (the scheduled GitHub Action)
//   node scripts/footer.mjs inject [site dir]   put the header at the start and the footer at the end of every page and
//                                               404.html (part of npm run build)
// The markup is the website's <header> and <footer> as-is, with links made absolute. Their styles are the website's own
// CSS rules that apply to them, scoped to .nyf-header and .nyf-footer, after a reset, so they and the interactive can't
// restyle each other. Interactives use the header's short version (the bar the site shows once you scroll): the logo,
// the menu, Donate and Sign Up. Its menu runs on the site's JS bundle, which interactives don't load: brand/header.js
// does the same in a few lines.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { htmlFiles } from "./pages.mjs";

const SITE = "https://nysfocus.com";
const PARTS = {
  footer: { html: "brand/footer.html", css: "brand/footer.css", scope: ".nyf-footer",
    start: "<!-- nyf-footer: the nysfocus.com footer, from brand/ by npm run build. Don't edit here; run npm run footer:sync. -->",
    end: "<!-- /nyf-footer -->" },
  header: { html: "brand/header.html", css: "brand/header.css", js: "brand/header.js", scope: ".nyf-header",
    start: "<!-- nyf-header: the nysfocus.com header, from brand/ by npm run build. Don't edit here; run npm run footer:sync. -->",
    end: "<!-- /nyf-header -->",
    // Classes the site's scripts add at run time (brand/header.js does it here), so their rules are kept too
    runtime: ["smaller", "menuopen", "menuclosed", "whitesvg", "hidden", "block"],
    // The short header is 52px tall; the full header's spacer (75px, 163px on desktop) would leave a gap under it. Its
    // fixed bar sets no top or left (the site's <body> has no margin or padding), so it's pinned here for pages that do.
    extra: ".nyf-header nav>div:not(.navbar){height:52px;padding-bottom:0}"
      + ".nyf-header nav>div:not(.navbar)>.fixed{top:0;left:0;right:0}" },
};

async function get(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.text();
}

// ---- CSS: a small parser for the site's compiled (Tailwind) stylesheet: rules, and at-rules holding rules ----
function parse(css) {
  const out = []; let i = 0;
  const block = (from) => {   // index after the matching "}"
    let d = 0;
    for (let j = from; j < css.length; j++) {
      if (css[j] === '"' || css[j] === "'") { const q = css[j]; for (j++; j < css.length && css[j] !== q; j++) if (css[j] === "\\") j++; }
      else if (css[j] === "{") d++;
      else if (css[j] === "}" && --d === 0) return j + 1;
    }
    throw new Error("unbalanced CSS");
  };
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const parseList = (from, to, list) => {
    i = from;
    while (i < to) {
      const open = css.indexOf("{", i), semi = css.indexOf(";", i);
      if (open < 0 || open >= to) break;
      if (css[i] === "@" && semi >= 0 && semi < open) { i = semi + 1; continue; }   // @charset/@import
      const head = css.slice(i, open).trim(), end = block(open);
      if (head.startsWith("@media") || head.startsWith("@supports")) {
        const node = { at: head, children: [] }; list.push(node);
        const save = end; parseList(open + 1, end - 1, node.children); i = save;
      } else {
        if (!head.startsWith("@")) list.push({ sel: head, body: css.slice(open + 1, end - 1) });   // skips @font-face, @keyframes
        i = end;
      }
      while (i < to && /\s/.test(css[i])) i++;
    }
  };
  parseList(0, css.length, out);
  return out;
}
const splitSel = (s) => {   // split a selector list on top-level commas
  const out = []; let d = 0, cur = "";
  for (let k = 0; k < s.length; k++) {
    const c = s[k];
    if (c === "\\") { cur += c + s[++k]; continue; }
    if (c === "(" || c === "[") d++; else if (c === ")" || c === "]") d--;
    if (c === "," && !d) { out.push(cur.trim()); cur = ""; } else cur += c;
  }
  return [...out, cur.trim()].filter(Boolean);
};
const ATTR = /(?<!\\)\[[^\]]*(?<!\\)\]/g;   // [type=button], not the escaped brackets of .w-\[18px\]
const classesOf = (sel) => [...sel.replace(ATTR, "").matchAll(/\.((?:\\.|[\w-])+)/g)].map((m) => m[1].replace(/\\(.)/g, "$1"));
const tagsOf = (sel) => [...sel.replace(ATTR, " ").replace(/\((?:[^()]|\([^()]*\))*\)|\.(?:\\.|[\w-])+|::?[\w-]+/g, " ")
  .matchAll(/(?:^|[\s>+~])([a-zA-Z][\w-]*)/g)].map((m) => m[1].toLowerCase());

// The site's rules that can apply inside a part (the header or footer), scoped to it.
function partCss(css, markup, { scope: wrap, runtime = [] }) {
  const classes = new Set([...markup.matchAll(/\bclass="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean).concat(runtime));
  const tags = new Set([...markup.matchAll(/<([a-zA-Z][\w-]*)/g)].map((m) => m[1].toLowerCase()));
  const keep = (sel) => {
    if (/(^|[\s>+~,(])(html|body|:root|:host)\b/.test(sel)) return false;
    return classesOf(sel).every((c) => classes.has(c)) && tagsOf(sel).every((t) => tags.has(t));
  };
  const scope = (sel) => `${wrap} ${sel}`;
  const emit = (nodes) => nodes.map((n) => {
    if (n.children) { const inner = emit(n.children); return inner ? `${n.at}{${inner}}` : ""; }
    const sels = splitSel(n.sel).filter(keep);
    return sels.length ? `${sels.map(scope).join(",")}{${n.body}}` : "";
  }).join("");
  const nodes = parse(css);
  const htmlRule = nodes.find((n) => n.sel && splitSel(n.sel).includes("html"));
  const font = (htmlRule?.body.match(/font-family:([^;]+)/) || [])[1] || "inherit";
  // Reset first, so nothing from the interactive leaks in (:where keeps it weaker than the site's rules that follow).
  // SVG is left alone: its fill and stroke attributes count as styles that "all: revert" would undo.
  const base = `${wrap}{all:revert;display:block;font-family:${font};font-size:16px;line-height:1.5;font-weight:400;`
    + "font-style:normal;letter-spacing:normal;text-transform:none;text-align:left;color:#000;-webkit-font-smoothing:antialiased;"
    + `-moz-osx-font-smoothing:grayscale}${wrap} :where(:not(svg,svg *)){all:revert}`;
  return base + emit(nodes) + "\n";
}

// The website's <header> or <footer>, with links, images and forms made absolute so they work from any page.
function partHtml(home, tag) {
  const i = home.indexOf(`<${tag}`), j = home.indexOf(`</${tag}>`, i);
  if (i < 0 || j < 0) throw new Error(`no <${tag}> on nysfocus.com`);
  return home.slice(i, j + tag.length + 3)
    .replace(/\b(href|src|action)="\/(?!\/)/g, `$1="${SITE}/`)
    .replace(/[ \t]+\n/g, "\n").replace(/\n{2,}/g, "\n").trim() + "\n";
}

// The header's menu runs on Alpine.js on the site. Its attributes become data-nyf-* ones that brand/header.js reads:
// :class="{ 'a': !open, 'b': open }" → data-nyf-closed="a" data-nyf-open="b"; @click="open = !open" → data-nyf-toggle.
// The site adds "smaller" to <header> once the reader scrolls; here it is always there, for the short version.
function headerHtml(home) {
  return partHtml(home, "header")
    .replace(/<header class="([^"]*)"/, (_, c) => `<header class="${c} smaller"`)
    .replace(/\s:class="\{([^"]*)\}"/g, (_, body) => {
      const closed = [], open = [];
      for (const [, cls, neg] of body.matchAll(/'([^']*)':\s*(!?)open/g)) (neg ? closed : open).push(cls);
      return ` data-nyf-closed="${closed.join(" ").trim()}" data-nyf-open="${open.join(" ").trim()}"`;
    })
    .replace(/\s@click="open = !open"/g, " data-nyf-toggle")
    .replace(/\s(?:x-data|x-state:on|x-state:off|x-description|x-bind:aria-expanded)="[^"]*"/g, "")
    .replace(/\sx-cloak\b/g, "");
}

async function fromWebsite() {
  const home = await get(SITE + "/");
  const cssUrl = (home.match(/<link\b[^>]*href="([^"]*\/dist\/assets\/app-[^"]+\.css)"/) || [])[1];
  if (!cssUrl) throw new Error("no app-*.css stylesheet on nysfocus.com");
  const css = await get(new URL(cssUrl, SITE).href);
  const footer = partHtml(home, "footer"), header = headerHtml(home);
  return { footer: { html: footer, css: partCss(css, footer, PARTS.footer) },
    header: { html: header, css: partCss(css, header, PARTS.header) } };
}

// The block npm run build puts on each page: "footer" (default) or "header".
export function block(name = "footer") {
  const p = PARTS[name], cls = p.scope.slice(1);
  const js = p.js ? `\n<script>${readFileSync(p.js, "utf8").trim()}</script>` : "";
  return `${p.start}\n<div class="${cls}">\n<style>${readFileSync(p.css, "utf8").trim()}${p.extra || ""}</style>\n${readFileSync(p.html, "utf8").trim()}${js}\n</div>\n${p.end}`;
}
const blockRe = (p) => new RegExp(`${p.start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${p.end}`);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {   // run as a command, not imported
  const [cmd, dir = "site"] = process.argv.slice(2);
  if (cmd === "sync" || cmd === "check") {
    const live = await fromWebsite();
    const same = (n) => existsSync(PARTS[n].html) && existsSync(PARTS[n].css)
      && readFileSync(PARTS[n].html, "utf8") === live[n].html && readFileSync(PARTS[n].css, "utf8") === live[n].css;
    const changed = Object.keys(PARTS).filter((n) => !same(n));
    if (cmd === "check") {
      console.log(changed.length ? `${changed.join(" and ")}: differs from nysfocus.com; run npm run footer:sync`
        : "header and footer: the same as nysfocus.com");
      process.exit(changed.length ? 1 : 0);
    }
    for (const n of changed) { writeFileSync(PARTS[n].html, live[n].html); writeFileSync(PARTS[n].css, live[n].css); }
    console.log(changed.length ? `${changed.join(" and ")}: updated in brand/; now run npm test, look at a page and commit`
      : "header and footer: already up to date");
  } else if (cmd === "inject") {
    const header = block("header"), footer = block("footer"), hre = blockRe(PARTS.header), fre = blockRe(PARTS.footer);
    let n = 0;
    for (const f of htmlFiles(dir)) {
      const path = `${dir}/${f}`, html = readFileSync(path, "utf8");
      let out = fre.test(html) ? html.replace(fre, () => footer) : html.replace(/<\/body>/i, () => `${footer}\n</body>`);
      out = hre.test(out) ? out.replace(hre, () => header) : out.replace(/<body\b[^>]*>/i, (b) => `${b}\n${header}`);
      if (!out.includes(footer) || !out.includes(header)) throw new Error(`${path}: no <body> and </body> to put the header and footer in`);
      if (out !== html) writeFileSync(path, out);
      n++;
    }
    console.log(`header and footer: on ${n} page(s)`);
  } else {
    console.error("usage: node scripts/footer.mjs sync | check | inject [site dir]");
    process.exit(2);
  }
}
