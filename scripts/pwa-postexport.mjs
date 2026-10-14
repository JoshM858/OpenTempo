// Runs after `expo export --platform web`. Turns dist/ into an installable PWA:
//  - renames assets/node_modules -> assets/vendor (some static hosts drop
//    node_modules folders, which would break fonts/icons)
//  - injects manifest / iOS home-screen tags and service-worker registration
//  - stamps sw.js with a build id and the list of files to precache
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const read = (p) => readFileSync(join(DIST, p), "utf8");
const write = (p, s) => writeFileSync(join(DIST, p), s);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// 1. node_modules -> vendor
const nm = join(DIST, "assets", "node_modules");
if (existsSync(nm)) {
  renameSync(nm, join(DIST, "assets", "vendor"));
  for (const f of walk(join(DIST, "_expo")).filter((f) => f.endsWith(".js"))) {
    const src = readFileSync(f, "utf8");
    if (src.includes("/assets/node_modules/")) {
      writeFileSync(f, src.replaceAll("/assets/node_modules/", "/assets/vendor/"));
    }
  }
}

// 2. index.html
let html = read("index.html");
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />',
);
const head = `
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="3to1 Golf" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="description" content="Golf swing tempo trainer: tempo beeps, frame-by-frame swing analysis and practice tracking." />
    <style>
      html, body { background: #000; overscroll-behavior: none; -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
    </style>
    <script>
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", function () {
          navigator.serviceWorker.register("/sw.js").catch(function () {});
        });
      }
    </script>
  `;
html = html.replace("</head>", `${head}</head>`);
write("index.html", html);
// GitHub Pages: serve the app for unknown paths (404.html) and skip Jekyll (it would drop _expo/).
write("404.html", html);
write(".nojekyll", "");

// 3. service worker
const entry = html.match(/src="(\/_expo\/static\/js\/web\/[^"]+\.js)"/)?.[1];
if (!entry) throw new Error("Could not find the entry bundle in dist/index.html");
const precache = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  entry,
];
const buildId = createHash("sha1").update(read(entry.slice(1))).digest("hex").slice(0, 10);
write(
  "sw.js",
  read("sw.js").replace("__BUILD_ID__", buildId).replace("__PRECACHE__", JSON.stringify(precache)),
);
console.log(`PWA ready in ${DIST}/ (build ${buildId}, ${precache.length} precached files)`);
