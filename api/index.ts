// Vercel serverless function entry: vercel.json rewrites every /api/* request here
// and the Hono app routes it based on the original URL.
import app from "../apps/api/src/app.js";

export default app;
