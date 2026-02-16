import {
  PutCommand,
  QueryCommand,
  type QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { docClient, tableName } from "./dynamo";
import type { GymSession } from "./types";

export async function listSessions(userId: string): Promise<GymSession[]> {
  const input: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
    ScanIndexForward: false,
  };

  const out = await docClient.send(new QueryCommand(input));
  return (out.Items || []) as GymSession[];
}

export async function upsertSession(
  userId: string,
  sessionDate: string,
  exercises: string[],
  notesRaw?: string,
): Promise<GymSession> {
  const now = new Date().toISOString();

  const item: GymSession = {
    userId,
    sessionDate,
    exercises,
    notesRaw,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    }),
  );

  return item;
}
