import { listBackups } from "../lib/sessions-repo";

const USER_ID = process.env.USER_ID || "me";
const LIMIT = Math.max(1, Math.min(100, Number(process.env.LIMIT || "20")));

async function run() {
  const backups = await listBackups(USER_ID, LIMIT);
  console.log(`Found ${backups.length} backups (showing up to ${LIMIT}):`);
  for (const backup of backups) {
    console.log(
      `${backup.backupId} | v${backup.schemaVersion} | sessionsV2=${backup.summary.sessionsV2} exercises=${backup.summary.exercises} locations=${backup.summary.locations}`,
    );
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
