# BEYOND THE VISIBLE — Cosmic Atelier

A Chinese-language cinematic, responsive homepage with a starfield canvas, orbiting planet illustration, interactive warp button, scroll reveal animations and an astronomy sources library with searching/filtering.

## Preview locally

Open `index.html` in a modern browser, or run `python -m http.server 8000` here and visit `http://localhost:8000`.

## Deploy on GitHub Pages

1. Create a **public** repository, e.g. `cosmic-atelier`.
2. Upload `index.html` to the repository root.
3. Go to **Settings → Pages → Build and deployment**.
4. Choose **Deploy from a branch**, branch `main`, folder `/(root)`, and save.
5. Your site should be published at `https://YOUR_USERNAME.github.io/cosmic-atelier/` after GitHub finishes deployment.

For `https://YOUR_USERNAME.github.io/`, name the repository `YOUR_USERNAME.github.io` instead.

## Notes

- No API keys, frameworks, external fonts, analytics or external runtime dependencies.
- The astronomy library is a manually curated link directory, *not* an automatically updated paper database.
- Add or revise library entries in the `sources` array inside `index.html`.
- This site does not redistribute journal article PDFs or images.
- Users who prefer reduced motion will see a static background and no animated scroll effects.
