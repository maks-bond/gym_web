import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "us-east-2";

const client = new DynamoDBClient({ region });

export const docClient = DynamoDBDocumentClient.from(client);

export const tables = {
  sessionsV1:
    process.env.DDB_TABLE_SESSIONS_V1 || process.env.DDB_TABLE_NAME || "GymSessions",
  sessionsV2Legacy: process.env.DDB_TABLE_SESSIONS_V2 || "GymSessionsV2",
  sessionsV2: process.env.DDB_TABLE_SESSIONS || "GymSessionsV2",
  exercises: process.env.DDB_TABLE_EXERCISES || "Exercises",
  locations: process.env.DDB_TABLE_LOCATIONS || "Locations",
  backups: process.env.DDB_TABLE_BACKUPS || "Backups",
};
