import {
  BatchGetCommand,
  DeleteCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  type QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { docClient, tables } from "./dynamo";
import type {
  Exercise,
  GymSessionV2,
  GymSessionView,
  LegacyGymSession,
  Location,
  SessionExerciseItem,
} from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

function uniq<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "item";
}

async function batchGetByIds<T>(
  tableName: string,
  keyName: string,
  ids: string[],
): Promise<T[]> {
  const unique = uniq(ids).filter(Boolean);
  if (unique.length === 0) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 100) {
    chunks.push(unique.slice(i, i + 100));
  }

  const out: T[] = [];

  for (const chunk of chunks) {
    const res = await docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [tableName]: {
            Keys: chunk.map((id) => ({ [keyName]: id })),
          },
        },
      }),
    );

    out.push(...(((res.Responses || {})[tableName] || []) as T[]));
  }

  return out;
}

export async function listLegacySessions(userId: string): Promise<LegacyGymSession[]> {
  const input: QueryCommandInput = {
    TableName: tables.sessionsV1,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
    ScanIndexForward: false,
  };

  const out = await docClient.send(new QueryCommand(input));
  return (out.Items || []) as LegacyGymSession[];
}

export async function upsertLegacySession(
  userId: string,
  sessionDate: string,
  exercises: string[],
  notesRaw?: string,
): Promise<LegacyGymSession> {
  const now = nowIso();

  const item: LegacyGymSession = {
    userId,
    sessionDate,
    exercises,
    notesRaw,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: tables.sessionsV1,
      Item: item,
    }),
  );

  return item;
}

export async function listLocations(): Promise<Location[]> {
  const out = await docClient.send(
    new ScanCommand({
      TableName: tables.locations,
    }),
  );

  return ((out.Items || []) as Location[]).sort((a, b) => a.name.localeCompare(b.name));
}

export async function upsertLocation(locationId: string, name: string): Promise<Location> {
  const now = nowIso();
  const item: Location = {
    locationId,
    name,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: tables.locations,
      Item: item,
    }),
  );

  return item;
}

export async function listExercises(query = "", limit = 50): Promise<Exercise[]> {
  const out = await docClient.send(
    new ScanCommand({
      TableName: tables.exercises,
    }),
  );

  const q = query.trim().toLowerCase();
  const all = (out.Items || []) as Exercise[];

  const filtered = q
    ? all.filter(
        (x) =>
          x.nameLower.includes(q) ||
          (x.aliases || []).some((alias) => alias.toLowerCase().includes(q)),
      )
    : all;

  return filtered
    .sort((a, b) => {
      const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;

      const countA = a.usageCount ?? 0;
      const countB = b.usageCount ?? 0;
      if (countA !== countB) return countB - countA;

      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

export async function getExercisesByIds(ids: string[]): Promise<Map<string, Exercise>> {
  const items = await batchGetByIds<Exercise>(tables.exercises, "exerciseId", ids);
  return new Map(items.map((x) => [x.exerciseId, x]));
}

export async function getLocationsByIds(ids: string[]): Promise<Map<string, Location>> {
  const items = await batchGetByIds<Location>(tables.locations, "locationId", ids);
  return new Map(items.map((x) => [x.locationId, x]));
}

export async function createExercise(input: {
  name: string;
  aliases?: string[];
  iconKey?: string;
  preferredId?: string;
}): Promise<Exercise> {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!name) {
    throw new Error("Exercise name is required");
  }

  const existing = await listExercises(name, 200);
  const exact = existing.find((x) => x.nameLower === name.toLowerCase());
  if (exact) return exact;

  const baseId = input.preferredId || slugify(name);
  let exerciseId = baseId;

  const byId = await getExercisesByIds([exerciseId]);
  if (byId.has(exerciseId)) {
    exerciseId = `${baseId}-${Date.now().toString().slice(-6)}`;
  }

  const aliases = uniq((input.aliases || []).map((x) => x.trim()).filter(Boolean));
  const now = nowIso();

  const item: Exercise = {
    exerciseId,
    name,
    nameLower: name.toLowerCase(),
    aliases,
    iconKey: input.iconKey,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: tables.exercises,
      Item: item,
    }),
  );

  return item;
}

export async function ensureExercise(input: {
  name: string;
  alias?: string;
  preferredId?: string;
}): Promise<Exercise> {
  const name = input.name.trim();
  const byName = await listExercises(name, 200);
  const existing = byName.find((x) => x.nameLower === name.toLowerCase());

  if (existing) {
    if (input.alias && !existing.aliases.includes(input.alias)) {
      const updated: Exercise = {
        ...existing,
        aliases: uniq([...existing.aliases, input.alias]),
        updatedAt: nowIso(),
      };
      await docClient.send(
        new PutCommand({
          TableName: tables.exercises,
          Item: updated,
        }),
      );
      return updated;
    }
    return existing;
  }

  return createExercise({
    name,
    aliases: input.alias ? [input.alias] : [],
    preferredId: input.preferredId,
  });
}

export async function upsertSessionV2(input: {
  userId: string;
  sessionDate: string;
  locationId: string;
  exerciseItems: SessionExerciseItem[];
  notesRaw?: string;
}): Promise<GymSessionV2> {
  const now = nowIso();

  const item: GymSessionV2 = {
    userId: input.userId,
    sessionDate: input.sessionDate,
    locationId: input.locationId,
    exerciseItems: input.exerciseItems,
    notesRaw: input.notesRaw,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: tables.sessionsV2,
      Item: item,
    }),
  );

  return item;
}

export async function clearSessionsV2(userId: string): Promise<number> {
  const sessions = await listRawSessionsV2(userId);
  let deleted = 0;

  for (const session of sessions) {
    await docClient.send(
      new DeleteCommand({
        TableName: tables.sessionsV2,
        Key: {
          userId: session.userId,
          sessionDate: session.sessionDate,
        },
      }),
    );
    deleted += 1;
  }

  return deleted;
}

export async function listRawSessionsV2(userId: string): Promise<GymSessionV2[]> {
  const out = await docClient.send(
    new QueryCommand({
      TableName: tables.sessionsV2,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false,
    }),
  );

  return ((out.Items || []) as GymSessionV2[]).filter((x) => !(x as { _deleted?: boolean })._deleted);
}

export async function listSessions(userId: string): Promise<GymSessionView[]> {
  const sessions = await listRawSessionsV2(userId);
  const exerciseIds = uniq(sessions.flatMap((s) => s.exerciseItems.map((x) => x.exerciseId)));
  const locationIds = uniq(sessions.map((s) => s.locationId));

  const [exerciseMap, locationMap] = await Promise.all([
    getExercisesByIds(exerciseIds),
    getLocationsByIds(locationIds),
  ]);

  return sessions.map((session) => ({
    ...session,
    locationName: locationMap.get(session.locationId)?.name || "Unknown",
    exerciseItems: session.exerciseItems.map((item) => ({
      ...item,
      name: exerciseMap.get(item.exerciseId)?.name || item.exerciseId,
    })),
  }));
}
