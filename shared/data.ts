import { defaultDataStructure, defaultSettings, BASE_PERMISSIONS } from "./defaults";

export type AccountingSnapshot = typeof defaultDataStructure;

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export function cloneDefaultData(): AccountingSnapshot {
  return clone(defaultDataStructure);
}

export function normalizeSnapshotData(input?: Partial<AccountingSnapshot> | null): AccountingSnapshot {
  const base = cloneDefaultData();

  if (!input || typeof input !== "object") {
    return base;
  }

  const result: Record<string, unknown> = { ...base };

  for (const key of Object.keys(base) as (keyof AccountingSnapshot)[]) {
    const baseValue = base[key];
    const incomingValue = input[key];

    if (Array.isArray(baseValue)) {
      result[key as string] = Array.isArray(incomingValue) ? incomingValue : baseValue;
      continue;
    }

    if (typeof baseValue === "object" && baseValue !== null) {
      const merged = {
        ...(baseValue as Record<string, unknown>),
        ...(incomingValue && typeof incomingValue === "object" ? (incomingValue as Record<string, unknown>) : {}),
      };

      if (key === "settings") {
        const incomingSettings =
          incomingValue && typeof incomingValue === "object"
            ? (incomingValue as Record<string, unknown>)
            : {};

        const mergedSettings: Record<string, unknown> = {
          ...defaultSettings,
          ...incomingSettings,
        };

        const incomingUsers = Array.isArray(incomingSettings.users)
          ? (incomingSettings.users as Record<string, unknown>[])
          : null;

        if (incomingUsers) {
          mergedSettings.users = incomingUsers.map((user, index) => {
            const baseUser =
              Array.isArray(defaultSettings.users) && defaultSettings.users[index]
                ? defaultSettings.users[index]
                : defaultSettings.users[0];

            const userPermissions = (user as { permissions?: unknown }).permissions;

            return {
              ...(baseUser || {}),
              ...user,
              permissions: {
                ...BASE_PERMISSIONS,
                ...(typeof userPermissions === "object" && userPermissions
                  ? (userPermissions as Record<string, unknown>)
                  : {}),
              },
            };
          });
        } else {
          mergedSettings.users = defaultSettings.users;
        }

        result[key as string] = mergedSettings;
      } else {
        result[key as string] = merged;
      }
      continue;
    }

    if (incomingValue !== undefined) {
      result[key as string] = incomingValue as unknown;
    } else {
      result[key as string] = baseValue as unknown;
    }
  }

  return result as AccountingSnapshot;
}
