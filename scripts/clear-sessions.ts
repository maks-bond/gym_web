import {
  BatchWriteCommand,
  QueryCommand,
  type QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { docClient, tableName } from "../lib/dynamo";

const USER_ID = process.env.USER_ID || "me";

async function run() {
  let lastEvaluatedKey: Record<string, unknown> | undefined;
  let deleted = 0;

  do {
    const input: QueryCommandInput = {
      TableName: tableName,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": USER_ID,
      },
      ProjectionExpression: "userId, sessionDate",
      ExclusiveStartKey: lastEvaluatedKey,
    };

    const out = await docClient.send(new QueryCommand(input));
    lastEvaluatedKey = out.LastEvaluatedKey as Record<string, unknown> | undefined;

    const items = (out.Items || []) as Array<{ userId: string; sessionDate: string }>;
    for (let i = 0; i < items.length; i += 25) {
      const chunk = items.slice(i, i + 25);
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: chunk.map((item) => ({
              DeleteRequest: {
                Key: {
                  userId: item.userId,
                  sessionDate: item.sessionDate,
                },
              },
            })),
          },
        }),
      );
      deleted += chunk.length;
    }
  } while (lastEvaluatedKey);

  console.log(`Deleted ${deleted} sessions for userId=${USER_ID}.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
