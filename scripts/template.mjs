// Keeps a project's template-owned files (template.json) the same as nyf-interactive-template's main branch, so every
// interactive gets the template's fixes and standards.
//   npm run template:sync    update them from the template, then run npm test, look at a page and open a PR
//   npm run template:check   list what differs and exit 1 if anything does (the weekly "Template sync check" Action)
// TEMPLATE_BRANCH=<branch> reads another branch of the template instead of main, to try a template change first.
// Whole files are replaced; in AGENTS.md and README.md only the template's side of the nyf-template-sync marker line is,
// so a project's own notes stay; package.json gets the template's scripts, keeping any the project adds.
// Reads the template with git. It's public, so no access is needed; if it ever goes private, git uses your own access
// locally, and GitHub Actions a TEMPLATE_READ_TOKEN secret (a read-only token for the template).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "./pages.mjs";

const MARKER = /^<!-- nyf-template-sync:.*-->$/m;
const DEFAULT = { repo: "https://github.com/New-York-Focus/nyf-interactive-template.git", branch: "main" };   // before a project has template.json

function fetchTemplate(t) {
  const token = process.env.TEMPLATE_READ_TOKEN;
  const url = token ? t.repo.replace("https://", `https://x-access-token:${token}@`) : t.repo;
  try {
    execFileSync("git", ["fetch", "--quiet", "--depth=1", "--no-tags", url, process.env.TEMPLATE_BRANCH || t.branch], { stdio: ["ignore", "ignore", "pipe"] });
  } catch {
    // never print the URL: it can hold the token
    throw new Error(`can't read ${t.repo.replace(/\.git$/, "")} (no access? locally, check your GitHub login; in Actions, a TEMPLATE_READ_TOKEN secret if the template is private)`);
  }
  const commit = execFileSync("git", ["rev-parse", "--short", "FETCH_HEAD"]).toString().trim();
  const show = (path) => {
    try { return execFileSync("git", ["show", `FETCH_HEAD:${path}`], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 26 }).toString(); }
    catch { return null; }
  };
  return { commit, show };
}

// The template's side of a marker-split file, combined with the project's side.
function merge(path, side, theirs, ours) {
  const split = (s) => { const m = s.match(MARKER); return m ? [s.slice(0, m.index), m[0], s.slice(m.index + m[0].length)] : null; };
  const t = split(theirs);
  if (!t) throw new Error(`the template's ${path} has no nyf-template-sync marker`);
  const o = ours !== null ? split(ours) : null;
  if (!o) {   // first sync: the template's file, and the project's old text kept on its own side for someone to tidy
    const old = ours ? `\n<!-- Before template:sync, this file read: -->\n${ours}` : "";
    return side === "above" ? t[0] + t[1] + t[2] + old : old + t[0] + t[1] + t[2];
  }
  return side === "above" ? t[0] + t[1] + o[2] : o[0] + t[1] + t[2];
}

function plan() {
  const local = existsSync("template.json") ? JSON.parse(readFileSync("template.json", "utf8")) : DEFAULT;
  const tpl = fetchTemplate(local);
  const t = JSON.parse(tpl.show("template.json"));   // the template's own list wins: new files arrive with it
  const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);
  const changes = [];
  for (const path of t.files) {
    const theirs = tpl.show(path);
    if (theirs === null) throw new Error(`template.json lists ${path}, which isn't in the template`);
    if (read(path) !== theirs) changes.push({ path, text: theirs });
  }
  for (const [path, side] of Object.entries(t.sections || {})) {
    // AGENTS.md replaced CLAUDE.md (which now only imports it): the first sync carries the project's side over from CLAUDE.md
    const ours = read(path) ?? (path === "AGENTS.md" && /nyf-template-sync/.test(read("CLAUDE.md") || "") ? read("CLAUDE.md") : null);
    const theirs = tpl.show(path), text = merge(path, side, theirs, ours);
    if (ours !== text) changes.push({ path, text });
  }
  if (t.packageScripts) {
    const theirs = JSON.parse(tpl.show("package.json")), ours = JSON.parse(read("package.json"));
    const scripts = { ...ours.scripts, ...theirs.scripts };
    if (JSON.stringify(scripts) !== JSON.stringify(ours.scripts))
      changes.push({ path: "package.json", text: JSON.stringify({ ...ours, scripts }, null, 2) + "\n" });
  }
  return { commit: tpl.commit, changes };
}

const cmd = process.argv[2];
if (config().slug === "example-interactive") {   // the template itself
  console.log("template: this is the template; nothing to sync");
} else if (cmd === "sync" || cmd === "check") {
  let result;
  try { result = plan(); } catch (e) { console.error(`template: ${e.message}`); process.exit(2); }
  const { commit, changes } = result;
  if (!changes.length) console.log(`template: up to date with nyf-interactive-template (${commit})`);
  else if (cmd === "check") {
    console.log(`template: ${changes.length} file(s) differ from nyf-interactive-template (${commit}); run npm run template:sync`);
    for (const c of changes) console.log(`  - ${c.path}`);
    process.exit(1);
  } else {
    for (const c of changes) { mkdirSync(dirname(c.path) || ".", { recursive: true }); writeFileSync(c.path, c.text); console.log(`  updated ${c.path}`); }
    console.log(`template: synced with nyf-interactive-template (${commit}); now npm test, look at a page, and open a PR`);
  }
} else {
  console.error("usage: node scripts/template.mjs sync | check");
  process.exit(2);
}
