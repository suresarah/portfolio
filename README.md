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
4. **Check the link-preview URLs.** Each page's `og:url` and `og:image` assume the site lives at `https://suresarah.github.io/portfolio/`. If you point a custom domain at it, find and replace that base URL. The preview image is `assets/share.jpg` (1200×630, a capture of the homepage).

## Confidential work

**This repo is public.** Do not commit Assistant or Horizon screens, videos, or unreleased details, even if you plan to put them behind a password. A client-side password on a static site doesn't protect anything, because the files are still downloadable from GitHub.

Host the full Designing in Code case study somewhere with real access control (a password-protected Readymag project, or a private link you send on request) and link to it from `work/designing-in-code.html`.

The one exception is `work/horizon.html`: it is **encrypted** (AES-256-GCM, key from the password via PBKDF2), so the repo only holds ciphertext. Its readable source and images live outside the repo in `~/portfolio-private`. Never copy anything from that folder into this one except the encrypted build. After Beyond, publish it as a normal page.
