<!-- nyf-template-sync: everything above this line is this project's own README; everything below comes from nyf-interactive-template (npm run template:sync replaces it). -->
# New York Focus interactive (template)

Start every reader-facing interactive from this repo. Each one is published at
`https://nysfocus.com/interactives/<slug>/` through the `nyf-interactives` Worker, from its own Cloudflare Pages project.

## Start a project
The quickest way: open an AI agent session (Claude Code, Codex) on this repo and say "start a new interactive"; it follows
`NEW-INTERACTIVE.md`. By hand:
1. Create a repo from this template, named `nyf-<slug>` (e.g. `nyf-2026-county-elections`), with **New-York-Focus** as its
   owner: GitHub picks your personal account by default, so switch the Owner menu before creating it.
2. Edit `interactive.json`: `slug` (the address after `/interactives/`), `pagesProject` (the Pages project name, normally the
   repo name) and `title`. Then search the repo for `example-interactive` and replace it with your slug.
3. Build the site into `site/`: one folder per page, each with an `index.html` (`site/county/erie/index.html` is served at
   `…/<slug>/county/erie/`). Keep data, images, styles and scripts in `site/` too.
4. `npm test` builds `site/sitemap.xml` and runs the checklist. It must pass; GitHub runs it on every pull request.
5. Ask Kyle to create the Cloudflare Pages project (below) and to add the test entry to `nyf-interactives`.

## The checklist (what `npm test` enforces)
- **Relative links only.** No `href`, `src`, `action`, `fetch()` or CSS `url()` starting with `/`, and no `<base>`.
- **Every page is a folder** ending in `/`.
- **Canonical and `og:url`** on every page are its `https://nysfocus.com/interactives/<slug>/…` address. No links to
  `pages.dev`, `github.io` or `workers.dev`.
- **`sitemap.xml`** lists exactly the pages. `npm run build` writes it, so don't edit it by hand.
- **`_headers`** starts with `X-Robots-Tag: noindex`, so the `pages.dev` copy stays out of search. The Worker removes it on nysfocus.com.
- **`404.html`** exists.
- **Static, unless it needs a Function.** For a Pages Function (`functions/`), set `"functions": true` in
  `interactive.json`. Functions must be GET only and must never log what readers type.
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
  they load on `nysfocus.com/interactives/…` but not on `pages.dev` previews, which show the fallbacks.
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

## Cloudflare Pages settings (Kyle creates the project)
Workers & Pages › Create application › Pages › **Connect to Git** (never direct upload: a direct-upload project can't be
connected to Git later):

| Setting | Value |
|---|---|
| Project name | the repo name, e.g. `nyf-2026-county-elections` |
| Production branch | `main` |
| Build command | `npm test` |
| Build output directory | `site` |
| Preview deployments | on: every branch gets a `<branch>.<project>.pages.dev` address (noindex) |

Merging to `main` publishes to production. Readers only see it once `nyf-interactives` serves the slug.

## Launch
1. Kyle adds `"<slug>-test": { project: "<pages project>", branch: "<a preview branch>" }` to `nyf-interactives`, then checks
   `nysfocus.com/interactives/<slug>-test/`.
2. Merge to `main` here (production).
3. Kyle's launch PR renames the entry to `<slug>` and removes `branch`. That merge is the launch.
