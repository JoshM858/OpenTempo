# OpenTempo (3to1 Golf web app)

Golf swing tempo trainer as an installable web app (PWA): tempo beeps, frame-by-frame
swing analysis, pro tempo references and practice tracking. Built with Expo / React Native Web.
Swing videos and practice data stay on the device (browser storage); optional account login and
cloud sync talk to the API server.

## Develop

```bash
pnpm install
pnpm dev            # http://localhost:8081 (Expo dev server, web)
pnpm typecheck
```

## Build & preview the PWA

```bash
pnpm build          # expo export (web) + PWA post-processing -> dist/
pnpm serve          # serves dist/ on http://localhost:8080
```

`dist/` is a plain static site. Host it anywhere **over HTTPS** (required for installing to the home
screen): Vercel (`vercel.json`), Netlify (`netlify.toml`), Cloudflare Pages, GitHub Pages, or any
static host. Every unknown path must fall back to `index.html` (already configured for Vercel/Netlify).

### API (login / cloud sync)

Set `EXPO_PUBLIC_API_URL` **at build time** to the deployed API server, e.g.
`EXPO_PUBLIC_API_URL=https://api.example.com pnpm build`. The API must allow CORS from the site's origin.
Without it the app still works fully locally; sign-in and sync just won't connect.

## Add to home screen

- **iPhone (Safari):** open the site, tap Share -> *Add to Home Screen*.
- **Android (Chrome):** open the site, menu -> *Install app* / *Add to Home screen*.

It then launches fullscreen like a native app and loads offline after the first visit.

## How the PWA is wired

- `public/manifest.webmanifest`, `public/icons/*` - app name, colours, icons (regenerate icons with `pnpm icons`).
- `public/sw.js` - service worker: network-first page loads, cache-first static assets, API calls never cached.
- `scripts/pwa-postexport.mjs` - injects manifest/iOS tags + SW registration, stamps the SW with a build id,
  and renames `assets/node_modules` -> `assets/vendor` (some hosts drop `node_modules` folders).

## Web limitations

Browsers can't do some things the native app does: no haptics, no frame thumbnails on swing cards, and the
Export button uses the browser share sheet where available. Audio starts after the first tap (browser rule).

## Deploy to Cloudflare Pages

Config lives in `wrangler.toml` and `public/_headers` (cache rules; the `/*` SPA fallback is in `public/_redirects`).

**Option A - Git integration (no tokens needed):** Cloudflare dashboard -> Workers & Pages -> Create -> Pages ->
Connect to Git -> pick this repo. Build command `pnpm install && pnpm run build`, output directory `dist`,
environment variables `NODE_VERSION=22` and `EXPO_PUBLIC_API_URL=<your API url>`. Every push redeploys.

**Option B - CLI:** set `CLOUDFLARE_API_TOKEN` (Pages: Edit permission) and `CLOUDFLARE_ACCOUNT_ID`, then
`EXPO_PUBLIC_API_URL=<your API url> pnpm run deploy`.

### Custom domain (548987.xyz)

After the first deploy: Workers & Pages -> opentempo -> Custom domains -> Set up a custom domain -> `548987.xyz`
(or a subdomain such as `tempo.548987.xyz`). If the domain's DNS is on Cloudflare the records are created
automatically; otherwise add the CNAME to `opentempo.pages.dev` that Cloudflare shows you (a subdomain is
easiest in that case, since apex CNAMEs need Cloudflare DNS). HTTPS is issued automatically, which is what
Add to Home Screen needs. Delete any home-screen icon made from the `pages.dev` address and re-add it from
the final domain, because the installed app is tied to the address it was installed from.
