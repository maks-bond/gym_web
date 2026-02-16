import {
  canonicalExerciseIdForLocation,
  canonicalExerciseNameForLocation,
  inferLocationIdFromExercises,
  stripLocationPrefix,
} from "../lib/normalize";
import {
  ensureExercise,
  listLegacySessions,
  upsertSessionV2,
} from "../lib/sessions-repo";

const USER_ID = process.env.USER_ID || "me";

async function run() {
  const sessions = await listLegacySessions(USER_ID);
  let migrated = 0;

  for (const session of sessions) {
    const locationId = inferLocationIdFromExercises(session.exercises);

    const exerciseIds: string[] = [];
    const seen = new Set<string>();

    for (const rawExercise of session.exercises) {
      const canonicalName = canonicalExerciseNameForLocation(rawExercise, locationId);
      const exercise = await ensureExercise({
        name: canonicalName,
        alias: stripLocationPrefix(rawExercise),
        preferredId: canonicalExerciseIdForLocation(rawExercise, locationId),
      });

      if (!seen.has(exercise.exerciseId)) {
        seen.add(exercise.exerciseId);
        exerciseIds.push(exercise.exerciseId);
      }
    }

    await upsertSessionV2({
      userId: USER_ID,
      sessionDate: session.sessionDate,
      locationId,
      exerciseItems: exerciseIds.map((exerciseId) => ({ exerciseId })),
      notesRaw: session.notesRaw,
    });

    migrated += 1;
    console.log(
      `Migrated ${session.sessionDate} -> ${exerciseIds.length} exercises (${locationId})`,
    );
  }

  console.log(`Done. Migrated ${migrated} sessions from legacy to normalized v2.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
