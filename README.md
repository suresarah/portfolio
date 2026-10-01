# sarahleach portfolio

Static site: plain HTML, CSS, and a little JavaScript. No build step.

- `index.html`: homepage. Projects sit in a "tenets" accordion: click a tab to expand it. Use arrow keys on the tabs to move between them. On phones the tabs stack vertically.
- `work/`: one page per case study.
- `styles.css`, `main.js`: shared styles and the accordion script.
- `assets/`: put exported images here.

## Preview locally

```sh
cd portfolio
python3 -m http.server 8000
# open http://localhost:8000
```

## Publish (GitHub Pages)

Repo Settings → Pages → Source: "Deploy from a branch" → `main` / root.

## Before sharing

1. **Resolve every `<mark class="confirm">`.** These show as orange dashed text with a `[confirm]` tag, and each one marks a fact that hasn't been confirmed yet. Replace it with the real fact or delete it. To find them all: `grep -rn 'class="confirm"' .`
2. **Swap each `.shot` placeholder for a real image.** Each placeholder says what screen goes there and what it proves. If you can't say what an image proves, cut it.
3. **Remove `<meta name="robots" content="noindex">`** from every page.

## Confidential work

**This repo is public.** Do not commit Assistant or Horizon screens, videos, or unreleased details, even if you plan to put them behind a password. A client-side password on a static site doesn't protect anything, because the files are still downloadable from GitHub.

Host the full Agentic Platform case study somewhere with real access control (a password-protected Readymag project, or a private link you send on request) and link to it from `work/agentic-platform.html`.
