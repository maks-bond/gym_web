import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, tables } from "../lib/dynamo";

type OldSession = {
  userId: string;
  sessionDate: string;
  locationId: string;
  exerciseItems: Array<{ exerciseId: string; notes?: string }>;
  notesRaw?: string;
  createdAt?: string;
  updatedAt?: string;
  _deleted?: boolean;
};

const USER_ID = process.env.USER_ID || "me";

function nowIso(): string {
  return new Date().toISOString();
}

function legacySessionId(sessionDate: string): string {
  return `legacy-${sessionDate}`;
}

async function run() {
  if (!tables.sessionsV2Legacy) {
    throw new Error("DDB_TABLE_SESSIONS_V2 is not configured");
  }

  const out = await docClient.send(
    new QueryCommand({
      TableName: tables.sessionsV2Legacy,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": USER_ID,
      },
      ScanIndexForward: false,
    }),
  );

  const oldSessions = ((out.Items || []) as OldSession[]).filter((x) => !x._deleted);
  let migrated = 0;

  for (const old of oldSessions) {
    const createdAt = old.createdAt || nowIso();
    const updatedAt = nowIso();
    const sessionId = legacySessionId(old.sessionDate);

    await docClient.send(
      new PutCommand({
        TableName: tables.sessionsV2,
        Item: {
          userId: old.userId,
          sessionId,
          sessionDate: old.sessionDate,
          sessionSortKey: `${old.sessionDate}T00:00`,
          locationId: old.locationId,
          exerciseItems: old.exerciseItems || [],
          notesRaw: old.notesRaw,
          createdAt,
          updatedAt,
        },
      }),
    );

    migrated += 1;
    console.log(`Migrated ${old.sessionDate} -> ${sessionId}`);
  }

  console.log(
    `Done. Migrated ${migrated} sessions from ${tables.sessionsV2Legacy} to ${tables.sessionsV2}.`,
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
