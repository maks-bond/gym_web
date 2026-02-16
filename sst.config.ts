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
    const sessionsTable = new sst.aws.Dynamo("GymSessions", {
      fields: {
        userId: "string",
        sessionDate: "string",
      },
      primaryIndex: {
        hashKey: "userId",
        rangeKey: "sessionDate",
      },
    });

    const web = new sst.aws.Nextjs("Web", {
      path: ".",
      link: [sessionsTable],
      environment: {
        DDB_TABLE_NAME: sessionsTable.name,
      },
    });

    return {
      url: web.url,
      tableName: sessionsTable.name,
    };
  },
});
