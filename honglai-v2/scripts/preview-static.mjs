import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve("out");
const port = Number(process.env.PORT || 4173);
const types = { ".css": "text/css", ".glb": "model/gltf-binary", ".html": "text/html", ".ico": "image/x-icon", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };

if (!existsSync(join(root, "index.html"))) {
  console.error("找不到 out/index.html，請先執行 npm run build。");
  process.exit(1);
}

function targetFor(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const relative = normalize(pathname).replace(/^([/\\])+/, "");
  const candidates = [join(root, relative), join(root, `${relative}.html`), join(root, relative, "index.html")];
  for (const candidate of candidates) {
    const resolved = resolve(candidate);
    if (resolved.startsWith(root) && existsSync(resolved) && statSync(resolved).isFile()) return resolved;
  }
  return null;
}

createServer((request, response) => {
  const target = targetFor(request.url || "/");
  if (!target) { response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }); response.end("找不到頁面"); return; }
  const type = types[extname(target)] || "application/octet-stream";
  const contentType = type.startsWith("text/") || type === "application/json" || type === "text/javascript" ? `${type}; charset=utf-8` : type;
  response.writeHead(200, { "content-type": contentType, "cache-control": "no-store" });
  createReadStream(target).pipe(response);
}).listen(port, "127.0.0.1", () => console.log(`鴻萊正式建置預覽：http://127.0.0.1:${port}`));
