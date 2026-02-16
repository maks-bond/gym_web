import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, tables } from "../lib/dynamo";
import { listRawSessionsV2 } from "../lib/sessions-repo";
import type { Exercise } from "../lib/types";

const USER_ID = process.env.USER_ID || "me";

async function run() {
  const sessions = await listRawSessionsV2(USER_ID);
  const usage = new Map<string, number>();

  for (const session of sessions) {
    for (const item of session.exerciseItems) {
      usage.set(item.exerciseId, (usage.get(item.exerciseId) || 0) + 1);
    }
  }

  const out = await docClient.send(
    new ScanCommand({
      TableName: tables.exercises,
    }),
  );

  const exercises = (out.Items || []) as Exercise[];
  const ranked = [...exercises].sort((a, b) => {
    const countA = usage.get(a.exerciseId) || 0;
    const countB = usage.get(b.exerciseId) || 0;
    if (countA !== countB) return countB - countA;
    return a.name.localeCompare(b.name);
  });

  for (let i = 0; i < ranked.length; i += 1) {
    const exercise = ranked[i];
    const updated: Exercise = {
      ...exercise,
      usageCount: usage.get(exercise.exerciseId) || 0,
      sortOrder: i + 1,
      updatedAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: tables.exercises,
        Item: updated,
      }),
    );
  }

  console.log(`Ranked ${ranked.length} exercises by frequency.`);
  for (const item of ranked.slice(0, 20)) {
    console.log(`${item.name} -> ${usage.get(item.exerciseId) || 0}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
