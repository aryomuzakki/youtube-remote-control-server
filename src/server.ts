import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { trimTrailingSlash } from "hono/trailing-slash";
import apiRouter from "./api/index";
import { routingErrorHandler } from "./services/error/routingErrorHandler";
import { getConfig } from "./config";
import type { CloudflareBindings } from "./types";

export const app = new OpenAPIHono<{ Bindings: CloudflareBindings }>({
  strict: true,
});

app.use(trimTrailingSlash());

// Configure CORS
app.use("*", async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => origin || "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type"],
    credentials: true,
    maxAge: 600,
  });
  return corsMiddleware(c, next);
});

app.get("/", (c) =>
  c.text(
    "ytrc-server is running!\nAccess the API at /api.\nDocumentation is available at /docs.",
  ),
);

app.route("/api", apiRouter);

// Setup OpenAPI spec
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "0.1.0",
    title: "ytrc-server API",
  },
});

// Swagger UI will require openapiSpec to be hosted or imported.
// For now, we'll keep a simple docs endpoint that can be wired up later.
// app.get("/docs", (c) => c.text("Coming soon"));

// Scalar UI (ready to be uncommented later)
app.get(
  "/docs",
  apiReference({
    theme: "kepler",
    spec: {
      url: "/openapi.json",
    },
  }),
);

// Global error handler
app.onError((err, c) => {
  return routingErrorHandler(err, c);
});
