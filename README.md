# Todd Of Tomorrow

todd.oftomorrow.net — the blog and video home. Built by B351 (signals #448, #461).

Astro 5 + Tailwind, deployed to GitHub Pages by `.github/workflows/deploy.yml` on
push to `main`. The blog pieces are copied from `of-tomorrow-website`; post URLs
are the same on both hosts (`/blog/<slug>/`).

```sh
npm ci
npm run dev          # http://localhost:4321
npm run build        # dist/
npm test             # Playwright: pages, canonicals, RSS, no third-party scripts
```

Posts live in `src/content/blog/`. A post whose canonical home is another site
goes in `CANONICAL_URLS` in `src/consts.ts`.
