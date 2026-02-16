import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";

const region = process.env.AWS_REGION || "us-east-1";
const tableName = process.env.DDB_TABLE_NAME || "GymSessions";

async function run() {
  const client = new DynamoDBClient({ region });

  try {
    const existing = await client.send(new DescribeTableCommand({ TableName: tableName }));
    const status = existing.Table?.TableStatus;
    if (status !== "ACTIVE") {
      console.log(`Table ${tableName} exists with status=${status}. Waiting for ACTIVE...`);
      await waitUntilTableExists(
        { client, maxWaitTime: 120 },
        { TableName: tableName },
      );
    }
    console.log(`Table ${tableName} is ACTIVE.`);
    return;
  } catch {
    // Continue and create table.
  }

  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "sessionDate", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "userId", KeyType: "HASH" },
        { AttributeName: "sessionDate", KeyType: "RANGE" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );

  console.log(`Created table ${tableName} in ${region}. Waiting for ACTIVE...`);
  await waitUntilTableExists(
    { client, maxWaitTime: 120 },
    { TableName: tableName },
  );
  console.log(`Table ${tableName} is ACTIVE.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
