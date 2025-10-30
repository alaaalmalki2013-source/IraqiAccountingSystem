import { eq, sql } from "drizzle-orm";
import { dataSnapshots } from "@shared/schema";
import { db } from "./db";
import { cloneDefaultData, normalizeSnapshotData, type AccountingSnapshot } from "@shared/data";

const SNAPSHOT_KEY = "primary";

export class VersionConflictError extends Error {
  latest?: SnapshotPayload;

  constructor(message: string, latest?: SnapshotPayload) {
    super(message);
    this.name = "VersionConflictError";
    this.latest = latest;
  }
}

export interface SnapshotPayload {
  data: AccountingSnapshot;
  version: number;
  updatedAt: string;
}

export async function ensureSnapshotInitialized(): Promise<void> {
  const payload = cloneDefaultData();

  await db
    .insert(dataSnapshots)
    .values({
      key: SNAPSHOT_KEY,
      data: payload,
      version: 1,
    })
    .onConflictDoNothing({ target: dataSnapshots.key });
}

export async function getSnapshot(): Promise<SnapshotPayload> {
  const [row] = await db
    .select()
    .from(dataSnapshots)
    .where(eq(dataSnapshots.key, SNAPSHOT_KEY));

  if (!row) {
    await ensureSnapshotInitialized();
    return getSnapshot();
  }

  return {
    data: normalizeSnapshotData(row.data as AccountingSnapshot | undefined),
    version: row.version ?? 1,
    updatedAt: row.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

interface SaveSnapshotOptions {
  version: number;
  data: Partial<AccountingSnapshot>;
}

export async function saveSnapshot({ version, data }: SaveSnapshotOptions): Promise<SnapshotPayload> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(dataSnapshots)
      .where(eq(dataSnapshots.key, SNAPSHOT_KEY))
      .for("update");

    const normalized = normalizeSnapshotData(data as AccountingSnapshot);
    const nextVersion = (current?.version ?? Math.max(version, 1) - 1) + 1;
    const updatedAt = new Date();

    await tx
      .insert(dataSnapshots)
      .values({
        key: SNAPSHOT_KEY,
        data: normalized,
        version: nextVersion,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: dataSnapshots.key,
        set: {
          data: sql`EXCLUDED.data`,
          version: sql`EXCLUDED.version`,
          updatedAt: sql`EXCLUDED.updated_at`,
        },
      });

    return {
      data: normalized,
      version: nextVersion,
      updatedAt: updatedAt.toISOString(),
    } satisfies SnapshotPayload;
  });
}
