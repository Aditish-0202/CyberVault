import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Loads the workspace `.env` file when running outside of Replit.
 *
 * This module must be imported before any other local module so that
 * `DATABASE_URL`, `JWT_SECRET` and `ML_SERVICE_URL` are populated before
 * `@workspace/db` is evaluated.
 */
const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", "..", ".env"),
];

for (const file of candidates) {
  if (existsSync(file)) {
    try {
      process.loadEnvFile(file);
    } catch {
      // Ignore malformed env files; fall back to process env.
    }
    break;
  }
}
