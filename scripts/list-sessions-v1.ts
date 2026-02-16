import { listLegacySessions } from "../lib/sessions-repo";

const USER_ID = process.env.USER_ID || "me";
const LIMIT = Number(process.env.LIMIT || "30");

async function run() {
  const sessions = await listLegacySessions(USER_ID);
  const subset = sessions.slice(0, LIMIT);

  console.log(`Total sessions (legacy): ${sessions.length}`);
  console.log(`Showing newest ${subset.length} sessions:`);

  for (const session of subset) {
    console.log(`\n${session.sessionDate}`);
    for (const exercise of session.exercises) {
      console.log(`- ${exercise}`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
