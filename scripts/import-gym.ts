import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseGymTxt } from "../lib/parse-gym-txt";
import { upsertSession } from "../lib/sessions-repo";

const USER_ID = process.env.USER_ID || "me";
const IMPORT_MIN_DATE = process.env.IMPORT_MIN_DATE || "2025-01-01";

async function run() {
  const gymFilePath = process.env.GYM_FILE || resolve(process.cwd(), "gym.txt");
  const raw = readFileSync(gymFilePath, "utf-8");
  const parsedSessions = parseGymTxt(raw).filter(
    (session) => session.sessionDate >= IMPORT_MIN_DATE,
  );
  const mergedByDate = new Map<
    string,
    { exercises: string[]; notesRawParts: string[]; seen: Set<string> }
  >();

  for (const session of parsedSessions) {
    const existing = mergedByDate.get(session.sessionDate);
    if (!existing) {
      mergedByDate.set(session.sessionDate, {
        exercises: [...session.exercises],
        notesRawParts: session.notesRaw ? [session.notesRaw] : [],
        seen: new Set(session.exercises.map((x) => x.toLowerCase())),
      });
      continue;
    }

    for (const exercise of session.exercises) {
      const normalized = exercise.toLowerCase();
      if (!existing.seen.has(normalized)) {
        existing.exercises.push(exercise);
        existing.seen.add(normalized);
      }
    }

    if (session.notesRaw) {
      existing.notesRawParts.push(session.notesRaw);
    }
  }

  const sessions = [...mergedByDate.entries()]
    .map(([sessionDate, value]) => ({
      sessionDate,
      exercises: value.exercises,
      notesRaw: value.notesRawParts.join(" | "),
    }))
    .sort((a, b) => (a.sessionDate < b.sessionDate ? 1 : -1));

  for (const session of sessions) {
    await upsertSession(USER_ID, session.sessionDate, session.exercises, session.notesRaw);
    console.log(`Imported ${session.sessionDate} (${session.exercises.length} exercises)`);
  }

  console.log(
    `Done. Imported ${sessions.length} sessions from ${gymFilePath} (min date ${IMPORT_MIN_DATE}).`,
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
