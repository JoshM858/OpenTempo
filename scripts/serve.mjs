// Tiny zero-dependency static server for dist/ (used for local testing and on
// any Node host). Serves index.html for unknown paths so deep links work.
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const ROOT = join(process.cwd(), "dist");
const PORT = Number(process.env.PORT ?? 8080);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
};

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  let file = join(ROOT, path);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(ROOT, "index.html");
  const type = TYPES[extname(file)] ?? "application/octet-stream";
  // Hashed bundles/assets never change; the shell, service worker and manifest must stay fresh.
  const immutable = file.includes("/_expo/static/") || file.includes("/assets/");
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
  });
  createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Serving dist/ on http://localhost:${PORT}`));
