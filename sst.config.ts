/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "gym-web",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const sessionsV1Table = new sst.aws.Dynamo("GymSessions", {
      fields: {
        userId: "string",
        sessionDate: "string",
      },
      primaryIndex: {
        hashKey: "userId",
        rangeKey: "sessionDate",
      },
    });

    const sessionsV2Table = new sst.aws.Dynamo("Sessions", {
      fields: {
        userId: "string",
        sessionDate: "string",
      },
      primaryIndex: {
        hashKey: "userId",
        rangeKey: "sessionDate",
      },
    });

    const sessionsV3Table = new sst.aws.Dynamo("SessionsV3", {
      fields: {
        userId: "string",
        sessionId: "string",
      },
      primaryIndex: {
        hashKey: "userId",
        rangeKey: "sessionId",
      },
    });

    const exercisesTable = new sst.aws.Dynamo("Exercises", {
      fields: {
        exerciseId: "string",
      },
      primaryIndex: {
        hashKey: "exerciseId",
      },
    });

    const locationsTable = new sst.aws.Dynamo("Locations", {
      fields: {
        locationId: "string",
      },
      primaryIndex: {
        hashKey: "locationId",
      },
    });

    const backupsTable = new sst.aws.Dynamo("Backups", {
      fields: {
        userId: "string",
        backupId: "string",
      },
      primaryIndex: {
        hashKey: "userId",
        rangeKey: "backupId",
      },
    });

    const web = new sst.aws.Nextjs("Web", {
      path: ".",
      link: [
        sessionsV1Table,
        sessionsV2Table,
        sessionsV3Table,
        exercisesTable,
        locationsTable,
        backupsTable,
      ],
      environment: {
        DDB_TABLE_SESSIONS_V1: sessionsV1Table.name,
        DDB_TABLE_SESSIONS_V2: sessionsV2Table.name,
        DDB_TABLE_SESSIONS: sessionsV3Table.name,
        DDB_TABLE_EXERCISES: exercisesTable.name,
        DDB_TABLE_LOCATIONS: locationsTable.name,
        DDB_TABLE_BACKUPS: backupsTable.name,
      },
    });

    return {
      url: web.url,
      sessionsV1TableName: sessionsV1Table.name,
      sessionsV2TableName: sessionsV2Table.name,
      sessionsTableName: sessionsV3Table.name,
      exercisesTableName: exercisesTable.name,
      locationsTableName: locationsTable.name,
      backupsTableName: backupsTable.name,
    };
  },
});
