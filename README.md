# New York Focus interactive (template)

Start every reader-facing interactive from this repo. Each one is published at
`https://nysfocus.com/interactives/<slug>/` through the `nyf-interactives` Worker, from its own Cloudflare Pages project.

## Start a project
1. Create a repo from this template, named `nyf-<slug>` (e.g. `nyf-2026-county-elections`).
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
- **Static only.** A Pages Function (`functions/`) needs Kyle's approval first. After approval, set `"functions": true` in
  `interactive.json`. Functions must be GET only and must never log what readers type.
- **No keys or tokens in the repo.** Kyle enters secrets in Cloudflare himself.
- **Analytics** on every page: the Plausible script and the Google Tag Manager snippet, exactly as in `site/index.html` (the same as nysfocus.com).

Not checked automatically, but expected: a `share.png` (1200×630) referenced by `og:image`, and a page that works at phone width.

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
