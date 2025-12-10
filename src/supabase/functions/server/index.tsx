import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-f4b89a46/health", (c) => {
  return c.json({ status: "ok" });
});

// Get global capture count
app.get("/make-server-f4b89a46/capture-count", async (c) => {
  try {
    const count = await kv.get("global_capture_count");
    return c.json({ count: count || 0 });
  } catch (error) {
    console.error("Error getting capture count:", error);
    return c.json({ error: "Failed to get capture count" }, 500);
  }
});

// Increment global capture count
app.post("/make-server-f4b89a46/capture-count/increment", async (c) => {
  try {
    const currentCount = await kv.get("global_capture_count");
    const newCount = (currentCount || 0) + 1;
    await kv.set("global_capture_count", newCount);
    return c.json({ count: newCount });
  } catch (error) {
    console.error("Error incrementing capture count:", error);
    return c.json({ error: "Failed to increment capture count" }, 500);
  }
});

Deno.serve(app.fetch);