import { createBackup } from "../lib/sessions-repo";

const USER_ID = process.env.USER_ID || "me";

async function run() {
  const backup = await createBackup(USER_ID);
  console.log("Created backup:");
  console.log(JSON.stringify(backup, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
