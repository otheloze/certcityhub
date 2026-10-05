// Passenger startup file for cPanel's "Setup Node.js App".
//
// Passenger (and plain `node server.js`) needs a concrete entry point that
// calls `http.createServer` itself - the `next start` CLI isn't one. This
// wraps the same production build `next start` would serve, so behavior is
// identical; it's only how the process gets launched that differs.
//
// cPanel injects PORT (and sometimes passes 0.0.0.0 as the bind address);
// locally this file is unused - `npx next build && next start` still works
// exactly as before for the non-cPanel workflow described in CLAUDE.md.
const { createServer } = require("http");
const next = require("next");

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const hostname = "0.0.0.0";

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, hostname, () => {
    console.log(`Web server listening on http://${hostname}:${port}`);
  });
});
