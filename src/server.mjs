import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { loadCorpus, route } from "./runtime.mjs";

const corpus = await loadCorpus();
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 8787);

const staticFiles = new Map([
  ["/", ["../public/index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["../public/app.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["../public/styles.css", "text/css; charset=utf-8"]]
]);

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if ((req.method ?? "GET") === "GET" && staticFiles.has(url.pathname)) {
    const [relative, type] = staticFiles.get(url.pathname);
    try {
      const body = await readFile(new URL(relative, import.meta.url));
      res.statusCode = 200;
      res.setHeader("content-type", type);
      res.setHeader("cache-control", "no-cache");
      res.end(body);
      return;
    } catch {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
  }

  const result = route(req.method ?? "GET", url.pathname, corpus);
  res.statusCode = result.status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-cache");
  res.end(JSON.stringify(result.body, null, 2));
});

server.listen(port, host, () => {
  console.log(`JIZZ observatory listening on http://${host}:${port}`);
});
