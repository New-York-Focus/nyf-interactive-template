<!-- nyf-template-sync: everything above this line is this project's own README; everything below comes from nyf-interactive-template (npm run template:sync replaces it). -->
# New York Focus interactive (template)

Start every reader-facing interactive from this repo. Each one is published at
`https://nysfocus.com/interactives/<slug>/` through the `nyf-interactives` Worker, from its own Cloudflare Worker with
static assets.

## Start a project
The quickest way: open an AI agent session (Claude Code, Codex) on this repo and say "start a new interactive"; it follows
`NEW-INTERACTIVE.md`. By hand:
1. Create a repo from this template, named `nyf-<slug>` (e.g. `nyf-2026-county-elections`), with **New-York-Focus** as its
   owner: GitHub picks your personal account by default, so switch the Owner menu before creating it.
2. Edit `interactive.json`: `slug` (the address after `/interactives/`), `worker` (the Cloudflare Worker's name, normally
   the repo name) and `title`, and set the same Worker name as `name` in `wrangler.jsonc`. Then search the repo for
   `example-interactive` and replace it with your slug.
3. Build the site into `site/`: one folder per page, each with an `index.html` (`site/county/erie/index.html` is served at
   `…/<slug>/county/erie/`). Keep data, images, styles and scripts in `site/` too.
4. `npm test` builds `site/sitemap.xml` and runs the checklist. It must pass; GitHub runs it on every pull request. Until
   the project has its own link cards, `npm run card:setup` writes a plain setup card so the setup can be committed;
   `npm test` warns about it, and `npm run check:launch` fails on it.
5. Ask Kyle to create the Cloudflare Worker (below) and to add the test entry to `nyf-interactives`.

## The checklist (what `npm test` enforces)
- **Relative links only.** No `href`, `src`, `action`, `fetch()` or CSS `url()` starting with `/`, and no `<base>`.
- **Every page is a folder** ending in `/`.
- **Canonical and `og:url`** on every page are its `https://nysfocus.com/interactives/<slug>/…` address. No links to
  `pages.dev`, `github.io` or `workers.dev`.
- **`sitemap.xml`** lists exactly the pages. `npm run build` writes it, so don't edit it by hand.
- **`_headers`** starts with `X-Robots-Tag: noindex`, so the `workers.dev` copy stays out of search. The router removes it
  on nysfocus.com.
- **`404.html`** exists.
- **`wrangler.jsonc`** names the Worker in `interactive.json` and serves `site/`: `assets.directory` `site`,
  `not_found_handling` `404-page`, every page a folder (`auto-trailing-slash`), and `workers_dev` and `preview_urls` on.
- **Static, unless it needs server routes.** Server code goes in `worker/`, with `main` in `wrangler.jsonc`; it never
  logs what readers send, holds no keys, and any route that writes checks a secret token against the `Authorization`
  header (the rules are in `AGENTS.md`). Pages Functions (`functions/`) aren't allowed on a Worker.
- **No keys or tokens in the repo.** Kyle enters secrets in Cloudflare himself.
- **Analytics** on every page: the Plausible script (tagged `event-category="Interactives"`, so interactives can be filtered in
  Plausible like article categories) and the Google Tag Manager snippet, exactly as in `site/index.html`.
- **Brand fonts** on every page: the nysfocus.com font kit `<link>`, as in `site/index.html`.
- **The nysfocus.com header and footer** on every page and `404.html`, exactly as in `brand/`. `npm run build` puts them there; don't edit them in the pages.
- **The shared head tags** on every page and `404.html`, exactly as in `brand/head.html`: Wisepops (the newsletter and donation
  popups on nysfocus.com; which campaigns show where is set in Wisepops), the site's icons, the social tags that are the
  same on every page (`og:site_name`, `twitter:site`…) and a font preconnect. `npm run build` puts them before `</head>`.

- **Search and link cards, on every page** (a project can't launch without them):
  - a `<title>` no wider than **580px** in Google's results (20px Arial), and a `<meta name="description">` no wider than
    **920px** (14px Arial). `npm test` measures both and prints the width. No two pages share a title or a description.
  - a link-card image: `og:image` pointing to a **1200×630 PNG or JPEG** in this project (under 5 MB), with matching
    `og:image:width` and `og:image:height`, an `og:image:alt` describing it, and `twitter:card` set to `summary_large_image`.
    `site/share.png` is a placeholder: `npm test` fails if a project still uses it. Make one image per page if the pages
    differ (the county elections project draws each county's chart); keep text off the image, since platforms show the
    page title beside it.

Not checked automatically, but expected: `twitter:image:alt` (the same as `og:image:alt`), and a page that works at phone width.

## Brand: colors, fonts, the header and the footer
- **Colors, fonts and spacing:** `site/brand.css` has the nysfocus.com colors, type and spacing as CSS variables
  (`--nyf-yellow`, `--nyf-ink`, `--nyf-font-headline`, `--nyf-font-serif`…, and the 8px spacing scale `--nyf-space-1`
  to `--nyf-space-8`, with `--nyf-gutter` and `--nyf-section`, which grow with the screen as the site's do). Space things
  as the site does: tight inside a group, generous between groups. Link the font kit and `brand.css` from every page, as `site/index.html`
  does, and style with the variables. The fonts (Knockout and Chronicle, from Hoefler&Co) are licensed for nysfocus.com:
  they load on `nysfocus.com/interactives/…` but not on `workers.dev` previews, which show the fallbacks.
- **Shared pieces:** `brand.css` also has the site's section header, a full-width yellow bar (`<h2 class="nyf-section-bar">`,
  inside a container padded by `--nyf-gutter`); the dek under the headline (`<p class="nyf-dek">` right after the `<h1>`);
  a sentence under a section bar on what the section shows (`<p class="nyf-section-dek">`); a label above a list
  (`<p class="nyf-label">`, uppercase under a short yellow rule); secondary text such as "47% reporting" (`.nyf-meta`); and
  the site's 1366px frame for data pages (`<main class="nyf-wide">`; article-like pages keep a narrow reading column).
  `site/index.html` uses them.
- **Footer:** the website's footer, as-is, at the end of every page. `brand/footer.html` is the website's `<footer>` with
  links made absolute; `brand/footer.css` is the website's own CSS rules for it, scoped to `.nyf-footer` after a reset, so
  the footer and the interactive can't restyle each other. `npm run build` (part of `npm test`) inserts both before
  `</body>` on every page, between `<!-- nyf-footer… -->` and `<!-- /nyf-footer -->`.
- **Header:** the short version of the website's header (the bar it shows once you scroll: logo, menu, Donate and
  Sign Up) at the start of every page, the same way as the footer: `brand/header.html` and `brand/header.css`, scoped to
  `.nyf-header`, between `<!-- nyf-header… -->` and `<!-- /nyf-header -->`. On the site its menu runs on the site's JS
  bundle, which interactives don't load; `brand/header.js` does the same in a few lines (the sync turns the menu's
  Alpine.js attributes into `data-nyf-*` ones it reads). Until nysfocus.com fixes them, the sync also gives the menu
  icons `alt=""` and the logo link a name ("New York Focus"), which screen readers and Lighthouse need.
- **Keeping them in sync:** when the website's header or footer changes, run `npm run footer:sync`, then `npm test`, look
  at a page and open a PR with `brand/` and `site/`. The "Footer sync check" GitHub Action compares them every morning and
  opens an issue when they differ (run it by hand from the Actions tab too).

## Maps (SVG)
Lessons from the 2026 election results maps:
- **Borders drawn once.** Each shape drawing its own border makes shared borders look doubled or thin, and a neighbor
  drawn later covers half of a hover outline. All three fixes are needed:
  1. When thinning shapes, snap points to a fixed grid (not "drop a point close to the last one"), so neighbors keep the
     same points along the border they share.
  2. `vector-effect: non-scaling-stroke` on map paths, so a 1px border is 1px however the map is scaled.
  3. Shapes get `stroke: none`; a script clones each path's `d` into a `<g class="edges">` above them, with
     `pointer-events: none`, and moves the hovered shape's border to the end of that layer. (On a simpler map, moving
     the hovered shape itself to the end of the SVG fixes the hover outline.)
- **Gotchas:** give the cloned border paths a class, or a rule like `path:not([class]) { fill: … }` fills them and covers
  the map. An SVG element has no `.hidden` property: use `toggleAttribute("hidden", …)`. SVG text scales with the
  drawing: size map labels from the viewBox (e.g. `W / 46`), not in CSS pixels.
- **Smaller maps:** inline SVG is most of a map page's weight. Snap coordinates to a grid and write paths as relative
  steps (`l-.5 2.5 1.5.5`, not `L325.5,299L327,299.5`): the 2026 election results home page went from 1.24 MB to 0.74 MB
  with identical shapes.
- **Phones:** a map has to earn its scroll there. The election results home page hides its maps under 600px (the page
  is 60% shorter); its race pages, where the map is the point, keep theirs.
- **New York City:** a "New York State / New York City" switch showing one view at a time, both the same height
  (`aspect-ratio` on both SVGs), reads better than an inset or stacking them.
- **Hover cards:** the place's own results in a small table (party dot, last name, votes, share), one `tip()` for every map.

Other patterns that worked: a winner's checkmark in a narrow last column, empty on other rows so nothing shifts before a
call, with a CSS tooltip (`::after { content: attr(data-tip) }`) and an `aria-label`; a sticky map beside a list
(`position: sticky` inside a grid), stacked on a phone. To measure nysfocus.com's styles, render saved copies of its
pages with Playwright, outside requests blocked, and read the computed styles.

## Speed
Measured on the 2026 election results pages (Lighthouse, and a phone-speed Chromium), 2026-10-31:
- **Nothing shifts after load.** Anything a script draws after the page loads (a results table, a chart, a list) starts
  in the page at the size it will be: render it in the build with the same code, or reserve its space, including lines
  that appear later ("Called by …"). The results table that replaced a shorter list was those pages' biggest layout shift.
- **Images have `width` and `height`** (`npm test` fails one without), so their space is kept while they load.
- **Pages stay under 500 KB of HTML** (`npm test` warns): a big page costs a phone time just to read, however fast the
  connection. Move data and maps a page doesn't need at first into files the browser caches, or make them smaller (Maps).
- **Hidden panels draw their content the first time they open.** `loading="lazy"` doesn't stop images in an off-canvas
  panel from downloading: a live-updates panel was loading about 850 KB of photos on every visit.
- **Third-party scripts** are the largest script cost: Google Tag Manager's tags (GA4 and a Google Ads conversion tag)
  about 1.3s of a mid-range phone's processor, Cloudflare's bot check another 0.45s. Both are set outside the repo (in
  Google Tag Manager, and in Cloudflare for all of nysfocus.com); don't add more without asking.
- A floating button (bottom right) works alongside Wisepops, which opens in the center and can be closed.

## Cloudflare Worker settings (Kyle creates the Worker)
Workers & Pages › Create › Worker › **Import a repository** (Workers Builds), choosing `New-York-Focus/nyf-<slug>`:

| Setting | Value |
|---|---|
| Worker name | the repo name, the same as `worker` in `interactive.json` and `name` in `wrangler.jsonc` |
| Production branch | `main` |
| Build command | `npm test` |
| Deploy command | `npx wrangler deploy` |
| Preview builds | on (Settings › Build › Branch control): every branch gets a Preview at `<branch>-<worker>.new-york-focus.workers.dev` (noindex) |

The rest of the Worker's settings live in `wrangler.jsonc`, which every deploy applies.
- **Two kinds of key.** Workers Builds makes its own API token to deploy the Worker: that's Cloudflare's, and nobody
  handles it. A project's own secrets (a write route's token) are set by Kyle under Settings › Variables and Secrets,
  with **Production** selected (not Previews Base), never in the repo.
- **Storage.** A KV binding without an `id` (`"kv_namespaces": [{ "binding": "RESULTS" }]`) is created on the first deploy.
- **Previews** get none of production's vars, bindings or secrets: `wrangler.jsonc` › `previews` gives them safe values,
  and `npm test` fails if a project has vars or bindings without that block.

## Server routes and tests (only if a project needs them)
- **Code:** `worker/`, with `main` in `wrangler.jsonc`, and only what's deployed. List its routes in
  `assets.run_worker_first` so static pages don't run it. `AGENTS.md` › Rules has the rules for reader and write routes.
- **Paths:** the `nyf-interactives` router removes `/interactives/<slug>` before a request reaches the Worker, so
  `nysfocus.com/interactives/<slug>/api/x` arrives as `/api/x`. Write routes aren't reached through nysfocus.com at
  all: they're called at the Worker's `workers.dev` address.
- **Tests:** in `test/` (fixtures in `test/fixtures/`), run by a `test:project` script in `package.json`. GitHub runs it on
  every PR after `npm test`, installing from `package-lock.json` first. Keep test code out of `worker/`: `npm test` checks
  everything there as deployable code (a fake token in a test would fail it).
- **Local build tools** (map tools, Playwright for link cards) go in `source/package.json`, so the root, which Workers
  Builds installs, keeps only what the Worker and its tests need. A globally installed Playwright loads in an ES module
  with `createRequire(import.meta.url)("playwright")`; `import` doesn't find it.

Merging to `main` publishes to production. Readers only see it once `nyf-interactives` serves the slug.

## Launch
Each step is a PR in `nyf-interactives` (its `CLAUDE.md` has the details):
1. `"<slug>-test": { worker: "<worker>", preview: "<branch>" }`: check the Preview at `nysfocus.com/interactives/<slug>-test/`.
2. Merge to `main` here, so production is deployed (readers can't reach it yet).
3. Add the service binding for the Worker and change the entry to `{ worker, binding, test: true }`: check
   `<slug>-test` again, now through the path readers will use.
4. Once `npm run check:launch` passes here (every page has its own link card), rename the entry to `<slug>` and remove
   `test`. That merge is the launch.
