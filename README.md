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
- **The shared head tags** on every page and `404.html`, exactly as in `brand/head.html`: the site's icons, the social tags that are the
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
- **Colors, fonts and spacing:** `site/brand.css` has the nysfocus.com colors (with the brand kit's tertiary blues and
  light gray, `--nyf-blue-mid`, `--nyf-blue-light`, `--nyf-blue-pale` and `--nyf-grey-light`, for uses that need more
  colors to tell things apart), type and spacing as CSS variables
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
  From the 2026 election results: a kicker over the headline (`.nyf-kicker`: "Last updated at 10:42 p.m. ET on Nov. 3");
  breadcrumbs styled as the site's article categories (`.nyf-crumbs`); a section shelf, a row of links to an
  interactive's sections that sticks under the header (`.nyf-shelf`, on `--nyf-paper`, the page's own section with
  `aria-current="page"`, underlined in yellow); and tooltips (`.nyf-tip` with `data-tip` and an `aria-label`, on hover,
  focus or a tap, at most 12.5rem wide), which `site/brand.js` keeps 8px inside the screen (load it with
  `<script src="brand.js" defer>`). `site/index.html` and `site/detail/index.html` use them.
- **Type sizes, one per job** (`--nyf-text-*` in `brand.css`): 12px capitals for breadcrumbs, a shelf, labels and meta
  lines ("47% of election districts reporting", "Called by the Associated Press at 10:30 p.m. ET"); 14px gray for
  secondary text (a kicker, a source line, a party under a name, map legends); 16px for text, tables and controls; 18px
  for a section's description; 20px for the dek. Between a page's blocks, a section gap (`--nyf-section`), never stacked
  margins.
- **Editorial style** (New York Focus's style guide, in reader-facing text): "US" without periods ("US House"); the
  Oxford comma; office titles in full before a name ("Governor Kathy Hochul", "Representative Mike Lawler", "State
  Senator Leroy Comrie Jr."); "Assemblymember", one word; "State Assembly" and "State Senate", the chambers' legal names.
  Candidates' and officials' names as the official source has them.
- **Accepted alternatives** (Decisions): a dense dashboard with many sections may head them with a thin yellow rule and a
  heading in capitals (`.nyf-section-rule`) instead of the full bar; a data page may set its dek in sans, as wide as the
  page (`.nyf-dek.nyf-dek-data`), and keep Chronicle for long reading only (a live blog's posts); a project with many
  pages that look alike (district maps) may put the page's name on its link cards.
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
  Place a card against what it's actually positioned in (its `offsetParent`), not the map you assume it is: when a phone
  layout made the map `position: static`, every card showed far above the tap. Keep it on the screen: below and right of
  the point, or above it when there's no room below.
- **Legends** go under the map and name only what's on it: a color's key appears once that color is drawn (a third
  party, a tie), not before.
- **Filtered maps:** places a filter leaves out turn a flat light gray, so the state keeps its shape; those shown keep
  their color with an ink outline. A fade all but erased the state.

Other patterns that worked: a sticky map beside a list
(`position: sticky` inside a grid), stacked on a phone. To measure nysfocus.com's styles, render saved copies of its
pages with Playwright, outside requests blocked, and read the computed styles.

## Tables and filters
- **Data tables:** a row's color is a bar at its start, not a dot, so the name and the line under it start the same
  distance from it; dots stay where they label one line (legends, hover cards, column heads). Tables sort by any column
  (`aria-sort` on the header). On a phone, a wide table scrolls sideways in its own box with its first column pinned, so
  no page is wider than the screen, and a column that doesn't fit (votes) goes under the one beside it (the share).
- **Filters:** behind a quiet "Filters" button, closed at first; groups of options, each on or off, one per group (no
  "All": none on is everything), each with its count, the groups combined; while any is on, "Showing 22 of 150
  districts: open, contested · Clear filters" under the button. The choice goes in the page's address
  (`?seat=open&race=contested`) so a link opens on it. Counts that change with live data are counted again on each load,
  and an option with none stays on offer. On a wide screen the groups sit on one line, above the table and the map.

## Election projects
From the 2026 general election results (`nyf-2026-election-results`, its Decisions), for primaries and generals to come:
- **Winners called, never leaders:** a race is called when the Associated Press calls it, or when it's uncontested (as
  many candidates as seats, or fewer) once the polls close; nobody is "leading" or "trailing", since which districts
  have reported isn't known. Candidates are sorted by votes, with their shares and how many election districts have
  reported. An accepted alternative where no one calls the races (the 2026 county elections, from counties' unofficial
  counts): leads, labeled as leads, and never calls.
- **The winner's ✓:** right after the name where the share has a column of its own (a results table), after the share
  where it follows the name on the same line ("Meeks 80.5% ✓"); joined to the word before it so it never wraps alone; a
  tooltip (`.nyf-tip`) says who called it and when.
- **Incumbents:** "(i)" after the name, as the AP does (lowercase, so it doesn't read as Independent), joined to the
  name, "Incumbent" in its tooltip.
- **Party colors:** `--nyf-party-*` in `brand.css`, two shades each (the lighter for a margin under 10 points on a map),
  checked for color-blind readers; a race's party is its candidate's first line; votes on a candidate's lines combined
  by default.
- **Freshness:** a page with live results says when they were last updated over its headline ("Last updated at 10:42
  p.m. ET on Nov. 3", the official source's time), and names a part that's gone quiet. Search engines read that time from
  the page itself: write it, the page's `dateModified` and the sitemap's `<lastmod>` into the page as it's served (the
  election results' `worker/fresh.js`).
- **Google's LIVE label:** Google shows the red LIVE label in Top Stories only on a page marked up as a schema.org
  `LiveBlogPosting`; a `WebPage` with a fresh `dateModified` gets "2 hours ago" instead. On the 2026 election results,
  adding it put the home page in Top Stories with the label beside NBC's and the New York Times's within the hour
  (2026-11-04). Add it to the page with the live coverage (a live updates feed: that project's home page) as the Worker
  serves it, and only while the coverage is live:
  - `coverageStartTime`: when the coverage started (the feed was turned on); `coverageEndTime`: when it ends (the feed's
    hard stop). Google drops the label after the end, so move the end, not the markup, to extend the coverage.
  - `liveBlogUpdate`: the newest updates (10), each a `BlogPosting` with a `headline` (its text, cut to 110 characters),
    `articleBody`, `datePublished`, `url` and `author`; the updates must be ones a reader can see on the page.
  - `headline`, `url`, `image` and `publisher` as the page's own (its `og:title`, canonical and link card).
  - Nothing before there's an update, after the end, or on any other page; on any failure, the page as built.
  - The election results' `liveBlog` in `worker/fresh.js` (and its tests in `test/fresh.test.js`) does all of this; copy
    it. Check the live page with Google's Rich Results Test ("Live blog"), and ask for a recrawl in Search Console (URL
    Inspection › Request indexing) to have Google see it sooner. The label is Google's to show, and not promised.

## Speed
Measured on the 2026 election results pages (Lighthouse, and a phone-speed Chromium), 2026-10-31:
- **Nothing shifts after load.** Anything a script draws after the page loads (a results table, a chart, a list) starts
  in the page at the size it will be: render it in the build with the same code, or reserve its space, including lines
  that appear later ("Called by …"). The results table that replaced a shorter list was those pages' biggest layout shift.
- **Controls keep one height whatever the font.** A switch sized by its text was a pixel taller in Safari than elsewhere,
  nudging the map under it; give such controls a fixed height (and line height).
- **Images have `width` and `height`** (`npm test` fails one without), so their space is kept while they load.
- **Pages stay under 500 KB of HTML** (`npm test` warns): a big page costs a phone time just to read, however fast the
  connection. Move data and maps a page doesn't need at first into files the browser caches, or make them smaller (Maps).
- **Hidden panels draw their content the first time they open.** `loading="lazy"` doesn't stop images in an off-canvas
  panel from downloading: a live-updates panel was loading about 850 KB of photos on every visit.
- **Third-party scripts** are the largest script cost: Google Tag Manager's tags (GA4 and a Google Ads conversion tag)
  about 1.3s of a mid-range phone's processor, Cloudflare's bot check another 0.45s. Both are set outside the repo (in
  Google Tag Manager, and in Cloudflare for all of nysfocus.com); don't add more without asking.

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
- **Accepted alternatives** (Decisions): a live-data project may run its Worker on its pages too, to write how fresh their
  data is into them, as long as any failure serves the page as built. A route a reader's browser posts to (a newsletter
  sign-up) is allowed only through the router's list for that route, which checks the request comes from a nysfocus.com
  page and adds a shared secret the route checks.
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
