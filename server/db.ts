import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const sslEnabled = (process.env.DB_SSL ?? "").toLowerCase() === "true";

export const pool = new Pool({
  connectionString,
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });
