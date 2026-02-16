import { clearSessionsV2 } from "../lib/sessions-repo";

const USER_ID = process.env.USER_ID || "me";

async function run() {
  const deleted = await clearSessionsV2(USER_ID);
  console.log(`Deleted ${deleted} normalized sessions (v2) for userId=${USER_ID}.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
