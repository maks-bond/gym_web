import {
  BatchWriteCommand,
  ScanCommand,
  type ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { docClient, tables } from "../lib/dynamo";

async function run() {
  let lastEvaluatedKey: Record<string, unknown> | undefined;
  let deleted = 0;

  do {
    const input: ScanCommandInput = {
      TableName: tables.exercises,
      ProjectionExpression: "exerciseId",
      ExclusiveStartKey: lastEvaluatedKey,
    };

    const out = await docClient.send(new ScanCommand(input));
    lastEvaluatedKey = out.LastEvaluatedKey as Record<string, unknown> | undefined;

    const items = (out.Items || []) as Array<{ exerciseId: string }>;
    for (let i = 0; i < items.length; i += 25) {
      const chunk = items.slice(i, i + 25);
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [tables.exercises]: chunk.map((item) => ({
              DeleteRequest: {
                Key: {
                  exerciseId: item.exerciseId,
                },
              },
            })),
          },
        }),
      );
      deleted += chunk.length;
    }
  } while (lastEvaluatedKey);

  console.log(`Deleted ${deleted} exercises from ${tables.exercises}.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
