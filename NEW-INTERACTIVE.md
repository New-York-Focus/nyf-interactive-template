# Start a new interactive

Instructions for an AI agent (Claude Code, Codex or another). To use them, open a session on this repo
(`nyf-interactive-template`) and say "start a new interactive", or paste this file into a session anywhere.

Build the new interactive in its own new repo, never in this one: this repo is the template every project starts from.

I'm starting a new reader-facing interactive for New York Focus, built from our template repo
`New-York-Focus/nyf-interactive-template` on GitHub.

## First, ask me
Before anything else, get these answers. Ask only for what you can't find yourself, in one short message, and wait for
my reply.
1. **Who I am:** my name and role. Check first: your account or session details, my `git config user.name` and
   `user.email`, or my GitHub login. If you find it, confirm it with me rather than asking.
2. **What it is:** in a sentence or two, what readers will see and do. For example: "a map of every state prison with
   its population and staffing, plus a page per prison".
3. **The data:** where it comes from. For example: a spreadsheet, a file I'll attach, a script, or a public source.
4. **The address:** the slug after `nysfocus.com/interactives/`, lowercase with hyphens, e.g. `2027-prison-staffing`.
   Suggest one from my answer to 2, and let me accept it or change it.

If I already gave any of these in my message, don't ask again.

## Before you write anything
1. **Set up the repo.** It should be `New-York-Focus/nyf-<slug>`, created from the template.
   - If it doesn't exist yet and you can use `gh`, create it with
     `gh repo create New-York-Focus/nyf-<slug> --template New-York-Focus/nyf-interactive-template --private --clone`.
   - If you can't create it, give me these steps, and wait for me:
     1. Open https://github.com/New-York-Focus/nyf-interactive-template and click **Use this template › Create a new
        repository**.
     2. Under **Owner**, switch from your own account to **New-York-Focus**. GitHub picks your personal account by
        default, and a repo there can't be connected to our Cloudflare or seen by the team.
     3. Name it `nyf-<slug>`, choose **Private**, and click **Create repository**.
   - Check the repo's owner before going on: its address must start with `github.com/New-York-Focus/`. If it was made
     under a personal account, tell me to move it (the repo's **Settings › General › Danger Zone › Transfer ownership**,
     to New-York-Focus) or to delete it and create it again under New-York-Focus.
   - Then work only in the new repo. Its first commit deletes `NEW-INTERACTIVE.md`, which comes with the template.
2. **Read `AGENTS.md` and `README.md` in full.** They are this project's instructions, whatever tool you are
   (`CLAUDE.md` just imports `AGENTS.md`). They hold the rules, the brand and SEO standards, the Decisions everyone
   keeps, and how we work together.
3. **Look at a finished example:** `New-York-Focus/nyf-2026-county-elections`, live at
   https://nysfocus.com/interactives/2026-county-elections/. It shows how a project fills in `AGENTS.md`, builds its pages
   from data, and draws a link-card image per page.
4. **Propose a short plan,** and wait for my OK. Cover:
   - the pages and their addresses;
   - what each page shows;
   - how the pages are generated from the data;
   - any server routes it needs (an address lookup that calls an outside service, an ingest that receives data, a
     scheduled job), or none;
   - its search titles and descriptions;
   - its link-card images.

## While you build
- **Set up the project:**
  - Fill in `interactive.json` (slug, `worker` = the repo name, title) and the same name in `wrangler.jsonc`.
  - Replace `example-interactive` everywhere.
  - Fill in "This project" in `AGENTS.md`: what it is, who works on it, how it's built, and how to rebuild it.
- **Pages:**
  - The site lives in `site/`, one folder per page (`site/<page>/index.html`), with relative links only.
  - Generate the pages from the data with a script rather than by hand, so anyone can rebuild them.
- **Brand:** style with the variables in `site/brand.css`, and keep the font kit `<link>`, the analytics block and the
  shared head tags from the template.
  - `npm run build` adds the nysfocus.com header and footer; don't add or edit them yourself.
  - Keep it readable at phone width.
- **Search and sharing:** every page needs its own title (within 580px), description (within 920px) and 1200×630
  link-card image with alt text. Link cards carry no text.
- **Server routes:** keep it static unless it truly needs them. If it does, follow the rules in `AGENTS.md`:
  - the code goes in `worker/` (`main` in `wrangler.jsonc`); `site/` stays plain static files;
  - routes readers' browsers call are GET only, with a timeout on every outside call;
  - a route that writes checks a secret token and is never called from a reader's browser;
  - never log what readers type or what's posted;
  - no keys in the repo (tell me, and Kyle adds them in Cloudflare).
- **Shared files:** don't change the ones listed in `template.json` here. If one needs changing, say so; it's changed in
  `nyf-interactive-template`.
- **Testing:**
  - Run `npm test` before every commit; it must pass, and never weaken `scripts/check.mjs`.
  - Test what you claim before you claim it.
  - The brand fonts only load on nysfocus.com addresses: `workers.dev` previews show fallback fonts, so check layout
    with that in mind.
- **Committing:**
  - Work on a branch and open a PR that says what changed, why, and how it was tested.
  - Add a dated line to "Decisions (this project)" for any lasting call, with who made it.
  - A New York Focus staff member merges a PR once its checks pass and it's up to date with `main`; you merge only when
    one of us explicitly tells you to. A merge publishes to the project's Worker.

## Getting it online
Kyle has the Cloudflare access, so ask me to send Kyle these:
1. **The Cloudflare Worker:** Workers & Pages › Create › Worker › Import a repository, this repo; production branch
   `main`, build command `npm test`, deploy command `npx wrangler deploy`, preview builds on (`README.md` › Cloudflare
   Worker settings). Plus any secret a write route needs.
2. **A test address:** an entry in `nyf-interactives` so we can check the project's Preview at
   `nysfocus.com/interactives/<slug>-test/` with the real fonts.
3. **The launch:** after production is deployed, the router's service binding to the Worker, tried at `<slug>-test`, then
   the entry at `/<slug>/` (`README.md` › Launch).

After the launch, check the live pages and the sitemap at `nysfocus.com/interactives/<slug>/sitemap.xml`.

Be concise with me, and ask when something is genuinely mine to decide (content, wording, design). Otherwise make
sensible choices and tell me what you chose.
