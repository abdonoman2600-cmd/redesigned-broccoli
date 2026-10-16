import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Used to create the tables on YOUR hosted database:
//   DATABASE_URL="postgresql://..." npx drizzle-kit push --config=drizzle.prod.config.ts
// (drizzle.config.json is the sandbox's local config and points at 127.0.0.1.)
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url },
});
