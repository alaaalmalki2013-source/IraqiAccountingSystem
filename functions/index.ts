import express from "express";
import * as functions from "firebase-functions";
import { registerRoutes } from "../server/routes";

type RuntimeConfig = Record<string, unknown>;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const applyRuntimeConfig = () => {
  const config = functions.config() as RuntimeConfig | undefined;
  if (!config) {
    return;
  }

  const assignValue = (path: string[], value: unknown) => {
    if (value === undefined || value === null) {
      return;
    }

    const normalizedSegments = path
      .filter(Boolean)
      .map((segment) => segment.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase());

    const envKey = normalizedSegments.at(-1) ?? "";

    if (!envKey) {
      return;
    }

    if (typeof value !== "string") {
      return;
    }

    if (!process.env[envKey]) {
      process.env[envKey] = value;
    }
  };

  const walk = (value: unknown, trail: string[] = []) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, nested] of Object.entries(value)) {
        walk(nested, [...trail, key]);
      }
      return;
    }

    assignValue(trail, value);
  };

  walk(config);
};

let setupPromise: Promise<void> | null = null;

const ensureInitialized = async () => {
  if (!setupPromise) {
    applyRuntimeConfig();
    setupPromise = registerRoutes(app).then(() => undefined);
  }

  await setupPromise;
};

export const api = functions.https.onRequest(async (req, res) => {
  await ensureInitialized();
  return app(req, res);
});
