// The nysfocus.com footer on every page, kept the same as the website's.
//   node scripts/footer.mjs sync    fetch nysfocus.com and update brand/footer.html and brand/footer.css (npm run footer:sync)
//   node scripts/footer.mjs check   exit 1 if the website's footer differs from brand/ (the scheduled GitHub Action)
//   node scripts/footer.mjs inject [site dir]   put the footer at the end of every page and 404.html (part of npm run build)
// The markup is the website's <footer> as-is, with links made absolute. Its styles are the website's own CSS rules that
// apply to it, scoped to .nyf-footer, after a reset, so the footer and the interactive can't restyle each other.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { htmlFiles } from "./pages.mjs";

const SITE = "https://nysfocus.com";
const HTML = "brand/footer.html", CSS = "brand/footer.css";
const START = "<!-- nyf-footer: the nysfocus.com footer, from brand/ by npm run build. Don't edit here; run npm run footer:sync. -->";
const END = "<!-- /nyf-footer -->";

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

// The site's rules that can apply inside the footer, scoped to .nyf-footer.
function footerCss(css, footer) {
  const classes = new Set([...footer.matchAll(/\bclass="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean));
  const tags = new Set([...footer.matchAll(/<([a-zA-Z][\w-]*)/g)].map((m) => m[1].toLowerCase()));
  const keep = (sel) => {
    if (/(^|[\s>+~,(])(html|body|:root|:host)\b/.test(sel)) return false;
    return classesOf(sel).every((c) => classes.has(c)) && tagsOf(sel).every((t) => tags.has(t));
  };
  const scope = (sel) => `.nyf-footer ${sel}`;
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
  const base = `.nyf-footer{all:revert;display:block;font-family:${font};font-size:16px;line-height:1.5;font-weight:400;`
    + "font-style:normal;letter-spacing:normal;text-transform:none;text-align:left;color:#000;-webkit-font-smoothing:antialiased;"
    + "-moz-osx-font-smoothing:grayscale}.nyf-footer :where(:not(svg,svg *)){all:revert}";
  return base + emit(nodes) + "\n";
}

// The website's <footer>, with links and images made absolute so they work from any page.
function footerHtml(home) {
  const i = home.indexOf("<footer"), j = home.indexOf("</footer>", i);
  if (i < 0 || j < 0) throw new Error("no <footer> on nysfocus.com");
  return home.slice(i, j + 9)
    .replace(/\b(href|src)="\/(?!\/)/g, `$1="${SITE}/`)
    .replace(/[ \t]+\n/g, "\n").replace(/\n{2,}/g, "\n").trim() + "\n";
}

async function fromWebsite() {
  const home = await get(SITE + "/");
  const cssUrl = (home.match(/<link\b[^>]*href="([^"]*\/dist\/assets\/app-[^"]+\.css)"/) || [])[1];
  if (!cssUrl) throw new Error("no app-*.css stylesheet on nysfocus.com");
  const html = footerHtml(home);
  return { html, css: footerCss(await get(new URL(cssUrl, SITE).href), html) };
}

export function block() {
  return `${START}\n<div class="nyf-footer">\n<style>${readFileSync(CSS, "utf8").trim()}</style>\n${readFileSync(HTML, "utf8").trim()}\n</div>\n${END}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {   // run as a command, not imported
  const [cmd, dir = "site"] = process.argv.slice(2);
  if (cmd === "sync" || cmd === "check") {
    const live = await fromWebsite();
    const same = existsSync(HTML) && existsSync(CSS) && readFileSync(HTML, "utf8") === live.html && readFileSync(CSS, "utf8") === live.css;
    if (cmd === "check") {
      console.log(same ? "footer: the same as nysfocus.com" : "footer: differs from nysfocus.com; run npm run footer:sync");
      process.exit(same ? 0 : 1);
    }
    writeFileSync(HTML, live.html); writeFileSync(CSS, live.css);
    console.log(same ? "footer: already up to date" : `footer: updated ${HTML} and ${CSS}; now run npm test and commit`);
  } else if (cmd === "inject") {
    const b = block(), re = new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END}`);
    let n = 0;
    for (const f of htmlFiles(dir)) {
      const path = `${dir}/${f}`, html = readFileSync(path, "utf8");
      const out = re.test(html) ? html.replace(re, () => b) : html.replace(/<\/body>/i, () => `${b}\n</body>`);
      if (out === html && !html.includes(b)) throw new Error(`${path}: no </body> to put the footer before`);
      if (out !== html) writeFileSync(path, out);
      n++;
    }
    console.log(`footer: on ${n} page(s)`);
  } else {
    console.error("usage: node scripts/footer.mjs sync | check | inject [site dir]");
    process.exit(2);
  }
}
