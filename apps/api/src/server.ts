import { serve } from "@hono/node-server";
import { app } from "./app.js";

const port = Number(process.env.PORT) || 8788;

serve({ fetch: app.fetch, hostname: "0.0.0.0", port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}/api`);
});
