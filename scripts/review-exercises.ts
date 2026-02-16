import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canonicalExerciseNameForLocation,
  inferLocationIdFromExercises,
  normalizeExerciseAlias,
} from "../lib/normalize";
import { listLegacySessions } from "../lib/sessions-repo";

const USER_ID = process.env.USER_ID || "me";

async function run() {
  const sessions = await listLegacySessions(USER_ID);
  const counts = new Map<string, number>();
  const grouped = new Map<string, Set<string>>();

  for (const session of sessions) {
    const locationId = inferLocationIdFromExercises(session.exercises);

    for (const raw of session.exercises) {
      const key = raw.trim();
      counts.set(key, (counts.get(key) || 0) + 1);

      const canonical = canonicalExerciseNameForLocation(raw, locationId);
      if (!grouped.has(canonical)) grouped.set(canonical, new Set());
      grouped.get(canonical)?.add(key);
    }
  }

  const rawRows = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

  const normalizedRows = [...grouped.entries()]
    .map(([canonical, aliases]) => ({
      canonical,
      aliases: [...aliases].sort((a, b) => a.localeCompare(b)),
      normalizedKeySample: normalizeExerciseAlias([...aliases][0] || canonical),
    }))
    .sort((a, b) => a.canonical.localeCompare(b.canonical));

  const report = {
    generatedAt: new Date().toISOString(),
    userId: USER_ID,
    sessions: sessions.length,
    uniqueRawExercises: rawRows.length,
    uniqueCanonicalExercises: normalizedRows.length,
    raw: rawRows,
    canonicalGroups: normalizedRows,
  };

  const outPath = resolve(process.cwd(), "data/exercise-review.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(`Wrote review report: ${outPath}`);
  console.log(`Raw unique: ${rawRows.length}, canonical unique: ${normalizedRows.length}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
