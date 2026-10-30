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
4. `npm test` builds `site/sitemap.xml` and runs the checklist. It must pass; GitHub runs it on every pull request.
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
- **Colors and fonts:** `site/brand.css` has the nysfocus.com colors and type as CSS variables (`--nyf-yellow`, `--nyf-ink`,
  `--nyf-font-headline`, `--nyf-font-serif`…). Link the font kit and `brand.css` from every page, as `site/index.html`
  does, and style with the variables. The fonts (Knockout and Chronicle, from Hoefler&Co) are licensed for nysfocus.com:
  they load on `nysfocus.com/interactives/…` but not on `workers.dev` previews, which show the fallbacks.
- **Footer:** the website's footer, as-is, at the end of every page. `brand/footer.html` is the website's `<footer>` with
  links made absolute; `brand/footer.css` is the website's own CSS rules for it, scoped to `.nyf-footer` after a reset, so
  the footer and the interactive can't restyle each other. `npm run build` (part of `npm test`) inserts both before
  `</body>` on every page, between `<!-- nyf-footer… -->` and `<!-- /nyf-footer -->`.
- **Header:** the short version of the website's header (the bar it shows once you scroll: logo, menu, Donate and
  Sign Up) at the start of every page, the same way as the footer: `brand/header.html` and `brand/header.css`, scoped to
  `.nyf-header`, between `<!-- nyf-header… -->` and `<!-- /nyf-header -->`. On the site its menu runs on the site's JS
  bundle, which interactives don't load; `brand/header.js` does the same in a few lines (the sync turns the menu's
  Alpine.js attributes into `data-nyf-*` ones it reads).
- **Keeping them in sync:** when the website's header or footer changes, run `npm run footer:sync`, then `npm test`, look
  at a page and open a PR with `brand/` and `site/`. The "Footer sync check" GitHub Action compares them every morning and
  opens an issue when they differ (run it by hand from the Actions tab too).

## Cloudflare Worker settings (Kyle creates the Worker)
Workers & Pages › Create › Worker › **Import a repository** (Workers Builds), choosing `New-York-Focus/nyf-<slug>`:

| Setting | Value |
|---|---|
| Worker name | the repo name, the same as `worker` in `interactive.json` and `name` in `wrangler.jsonc` |
| Production branch | `main` |
| Build command | `npm test` |
| Deploy command | `npx wrangler deploy` |
| Preview builds | on (Settings › Build › Branch control): every branch gets a Preview at `<branch>-<worker>.new-york-focus.workers.dev` (noindex) |

The rest of the Worker's settings live in `wrangler.jsonc`, which every deploy applies. Secrets (a write route's token)
are set by Kyle under Settings › Variables and Secrets, never in the repo.

Merging to `main` publishes to production. Readers only see it once `nyf-interactives` serves the slug.

## Launch
Each step is a PR in `nyf-interactives` (its `CLAUDE.md` has the details):
1. `"<slug>-test": { worker: "<worker>", preview: "<branch>" }`: check the Preview at `nysfocus.com/interactives/<slug>-test/`.
2. Merge to `main` here, so production is deployed (readers can't reach it yet).
3. Add the service binding for the Worker and change the entry to `{ worker, binding, test: true }`: check
   `<slug>-test` again, now through the path readers will use.
4. Rename the entry to `<slug>` and remove `test`. That merge is the launch.
