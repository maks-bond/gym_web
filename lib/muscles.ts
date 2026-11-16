// Keyword-based muscle group mapping. Order matters: first match wins
// (e.g. "Leg Curl" must hit hamstrings before the generic "curl" -> biceps rule).
const RULES: Array<[RegExp, string]> = [
  [/\brun\b|cardio|bike|treadmill/i, "cardio"],
  [/leg curl|hamstring|romanian/i, "hamstrings"],
  [/wrist/i, "forearms"],
  [/calf|calves/i, "calves"],
  [/abs\b|leg raise|crunch|plank/i, "abs"],
  [/tricep|dips|pushdown/i, "triceps"],
  [/curl|bicep/i, "biceps"],
  [/shrug|trap/i, "traps"],
  [/deadlift/i, "deadlift"],
  [/squat|leg press|quad|lunge/i, "legs"],
  [/shoulder|lateral raise|overhead press/i, "shoulders"],
  [/row|pull up|pull-up|lat |back machine/i, "back"],
  [/bench|chest|fly|push up|push-up/i, "chest"],
];

export const TRACKED_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "legs",
  "deadlift",
  "biceps",
  "triceps",
  "abs",
  "hamstrings",
  "calves",
];

export function muscleGroupOf(exerciseName: string): string {
  for (const [re, group] of RULES) {
    if (re.test(exerciseName)) return group;
  }
  return "other";
}

type SessionLike = {
  sessionId: string;
  sessionDate: string;
  exerciseItems: Array<{ exerciseId: string; name: string }>;
};

export type RotationDay = {
  groups: string[];
  lastDate: string;
  daysAgo: number;
  count: number;
  exampleSessionId: string;
  exampleExercises: string[];
};

export type Suggestions = {
  nextUp: RotationDay | null;
  rotation: RotationDay[];
  stale: Array<{ group: string; daysAgo: number | null }>;
  lastCardioDaysAgo: number | null;
};

function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

// sessions must be sorted newest first.
export function buildSuggestions(
  sessions: SessionLike[],
  today: string,
  opts = { recentSessions: 20, staleDays: 21 },
): Suggestions {
  const lastByGroup = new Map<string, string>();
  for (const session of sessions) {
    for (const item of session.exerciseItems) {
      const group = muscleGroupOf(item.name);
      if (!lastByGroup.has(group)) lastByGroup.set(group, session.sessionDate);
    }
  }

  // Rotation = combos of muscle groups that repeat among recent strength sessions.
  const strength = sessions
    .map((s) => ({
      session: s,
      groups: [
        ...new Set(
          s.exerciseItems
            .map((x) => muscleGroupOf(x.name))
            .filter((g) => g !== "cardio" && g !== "other"),
        ),
      ].sort(),
    }))
    .filter((x) => x.groups.length > 0)
    .slice(0, opts.recentSessions);

  const bySignature = new Map<string, RotationDay>();
  for (const { session, groups } of strength) {
    const key = groups.join("+");
    const existing = bySignature.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    bySignature.set(key, {
      groups,
      lastDate: session.sessionDate,
      daysAgo: daysBetween(session.sessionDate, today),
      count: 1,
      exampleSessionId: session.sessionId,
      exampleExercises: session.exerciseItems.map((x) => x.name),
    });
  }

  const rotation = [...bySignature.values()]
    .filter((x) => x.count >= 2)
    .sort((a, b) => b.daysAgo - a.daysAgo);

  const stale = TRACKED_GROUPS.map((group) => {
    const last = lastByGroup.get(group);
    return { group, daysAgo: last ? daysBetween(last, today) : null };
  })
    .filter((x) => x.daysAgo === null || x.daysAgo >= opts.staleDays)
    .sort((a, b) => (b.daysAgo ?? Infinity) - (a.daysAgo ?? Infinity));

  const lastCardio = lastByGroup.get("cardio");

  return {
    nextUp: rotation[0] || null,
    rotation,
    stale,
    lastCardioDaysAgo: lastCardio ? daysBetween(lastCardio, today) : null,
  };
}
