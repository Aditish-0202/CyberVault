import { defineConfig } from "drizzle-kit";
import path from "path";

// `drizzle-kit generate` only reads the schema and does not connect, but the
// config requires a URL. Real migrations (`push`) still need DATABASE_URL set
// to a reachable Postgres instance.
const url =
  process.env.DATABASE_URL ??
  "postgres://placeholder:placeholder@127.0.0.1:5432/placeholder";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
