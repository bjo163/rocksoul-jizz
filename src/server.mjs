import { createServer } from "node:http";
import { loadBundle, route } from "./runtime.mjs";

const bundle = await loadBundle();
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 8787);

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const result = route(req.method ?? "GET", url.pathname, bundle);
  res.statusCode = result.status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(result.body, null, 2));
});

server.listen(port, host, () => {
  console.log(`JIZZ perspective API listening on http://${host}:${port}`);
});
