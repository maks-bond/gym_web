// Creates a fresh server backup via the live API and writes it to backups/gym-backup.json.
// One file overwritten each time: git history is the version history and diffs stay small.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const BASE_URL = process.env.GYM_URL || "https://del583hszwti1.cloudfront.net";
const OUT_FILE = join(__dirname, "..", "backups", "gym-backup.json");

function byKey<T>(key: (x: T) => string) {
  return (a: T, b: T) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
}

async function run() {
  const created = await fetch(`${BASE_URL}/api/backup`, { method: "POST" });
  const createdPayload = await created.json();
  if (!created.ok) throw new Error(createdPayload.error || `POST failed: ${created.status}`);

  const backupId: string = createdPayload.backup.backupId;
  const res = await fetch(`${BASE_URL}/api/backup?backupId=${encodeURIComponent(backupId)}`);
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || `GET failed: ${res.status}`);

  const snapshot = payload.snapshot;
  snapshot.sessionsV1.sort(byKey((x: { sessionDate: string }) => x.sessionDate));
  snapshot.sessionsV2.sort(byKey((x: { sessionId: string }) => x.sessionId));
  snapshot.exercises.sort(byKey((x: { exerciseId: string }) => x.exerciseId));
  snapshot.locations.sort(byKey((x: { locationId: string }) => x.locationId));

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify({ meta: payload.meta, snapshot }, null, 2)}\n`);

  console.log(`Backup ${backupId} -> ${OUT_FILE}`);
  console.log(JSON.stringify(payload.meta.summary));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
