const LOCATION_PREFIXES = [/^g?work\s+/i, /^pf\s+/i, /^home\s+/i];
export type LocationId = "planet-fitness" | "work" | "street" | "unknown";

const CANONICAL_BY_ALIAS: Record<string, string> = {
  "bench press": "Bench Press",
  "deadlift": "Deadlift",
  "shoulder press": "Shoulder Press",
  "back": "Back",
  "chest": "Chest",
  "squats": "Squats",
  "lower abs": "Lower Abs",
  run: "Run",
  "dumbbell deadlift": "Dumbbell Deadlift",
  "dumbbell back": "One-Arm Dumbbell Row",
  row: "Row",
  "pull ups": "Pull Ups",
  pullups: "Pull Ups",
  "chest press": "Chest Press",
  "bicep curls barbell": "Barbell Bicep Curls",
  "seated leg press": "Seated Leg Press",
  "leg press": "Leg Press",
  "bicep curls": "Bicep Curls",
  "triceps machine": "Triceps Machine",
  triceps: "Triceps Machine",
  squat: "Squats",
  "leg curl": "Leg Curl",
  "inclined bench dumbbell": "Incline Dumbbell Bench Press",
  "back one arm dumbbell": "One-Arm Dumbbell Row",
  "wrist curls": "Wrist Curls",
  "triceps rope": "Triceps Rope Pushdown",
  "trapezoid barbell": "Barbell Shrugs",
  "shoulders dumbbell": "Dumbbell Shoulder Press",
  "shoulder press dumbbell": "Dumbbell Shoulder Press",
  "shoulder press barbell": "Barbell Shoulder Press",
  "seated leg curl": "Seated Leg Curl",
  "run 10k": "Run",
  "row barbell": "Barbell Row",
  "one arm dumbbell back": "One-Arm Dumbbell Row",
  "inclined dumbbell press": "Incline Dumbbell Bench Press",
  "dumbbell shoulder press": "Dumbbell Shoulder Press",
  dips: "Dips",
  "deadlift dumbbell": "Dumbbell Deadlift",
  "biceps curls machine": "Biceps Curl Machine",
  "bicep curls dumbbells": "Dumbbell Bicep Curls",
  "barbell biceps curls": "Barbell Bicep Curls",
  "barbell biceps": "Barbell Bicep Curls",
  "back one armed dumbbell": "One-Arm Dumbbell Row",
  "squats with barbell": "Barbell Squats",
  "squats dumbbell": "Dumbbell Squats",
  "shoulder press machine": "Shoulder Press Machine",
  shoulder: "Shoulder Press",
  "quads machine": "Quads Machine",
  "push ups at home": "Push Ups",
  "one-arm dumbbell row on bench": "One-Arm Dumbbell Row",
  "one arm dumbell bench": "One-Arm Dumbbell Row",
  "one arm dumbbell": "One-Arm Dumbbell Row",
  "machine triceps": "Triceps Machine",
  "leg raise abs": "Leg Raises",
  "leg abs": "Leg Raises",
  "inclined dumbbell chest press": "Incline Dumbbell Bench Press",
  "inclined bench press smith machine": "Incline Smith Machine Bench Press",
  "inclined bench press dumbbells": "Incline Dumbbell Bench Press",
  "inclined bench": "Incline Bench Press",
  "inclined bench chest": "Incline Bench Press",
  "inclined back one arm dumbbell": "One-Arm Dumbbell Row",
  "incline bench dumbbell press": "Incline Dumbbell Bench Press",
  "horizontal back": "Back Machine Row",
  "front squats": "Front Squats",
  "dumbbell trapezoid": "Dumbbell Shrugs",
  "dumbbell shrugs": "Dumbbell Shrugs",
  "dumbbell inclined press": "Incline Dumbbell Bench Press",
  "dumbbell chest": "Dumbbell Chest Press",
  "dumbbell biceps curls": "Dumbbell Bicep Curls",
  "dumbbell back one arm": "One-Arm Dumbbell Row",
  "butterfly chest dual adjustable pulley": "Cable Fly",
  "body weight squats": "Bodyweight Squats",
  "biceps machine": "Biceps Curl Machine",
  "biceps curl machine": "Biceps Curl Machine",
  biceps: "Bicep Curls",
  "bicep curls on dual adjustable pulley": "Cable Bicep Curls",
  "barbell trapezoid": "Barbell Shrugs",
  "barbell shoulder press": "Barbell Shoulder Press",
  "barbell row back": "Barbell Row",
  "barbell biceps curl": "Barbell Bicep Curls",
  "barbell bicep curls": "Barbell Bicep Curls",
  "shoukder press barbell": "Shoulder Press",
  "back horizontal machine": "Back Machine Row",
  "back dummbell": "One-Arm Dumbbell Row",
  "back dumbbells": "One-Arm Dumbbell Row",
  "back dumbbell bench": "One-Arm Dumbbell Row",
  "back dumbbell": "One-Arm Dumbbell Row",
  "10 pullups": "Pull Ups",
  "calf extension": "Calf Raise Machine",
  "chest incline press machine": "Incline Chest Press Machine",
  "chest 3 sets": "Chest Press",
  "pf chest incline press machine": "Incline Chest Press Machine",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "exercise";
}

export function normalizeExerciseAlias(raw: string): string {
  let value = raw.trim();

  for (const prefix of LOCATION_PREFIXES) {
    value = value.replace(prefix, "");
  }

  value = value.replace(/[.]/g, "");
  value = value.replace(/[()]/g, " ");
  value = value.replace(/\b\d+\s*sets?\b/gi, " ");
  value = value.replace(/\s+/g, " ").trim();

  return value.toLowerCase();
}

export function canonicalExerciseName(raw: string): string {
  return canonicalExerciseNameForLocation(raw, "unknown");
}

export function canonicalExerciseNameForLocation(
  raw: string,
  locationId: LocationId,
): string {
  const normalized = normalizeExerciseAlias(raw);

  if (/\bback\b/.test(normalized)) {
    if (locationId === "planet-fitness") return "Back Machine Row";
    if (locationId === "work" || locationId === "unknown") return "One-Arm Dumbbell Row";
  }

  const direct = CANONICAL_BY_ALIAS[normalized];
  if (direct) return direct;

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function canonicalExerciseId(raw: string): string {
  return canonicalExerciseIdForLocation(raw, "unknown");
}

export function canonicalExerciseIdForLocation(
  raw: string,
  locationId: LocationId,
): string {
  return slugify(canonicalExerciseNameForLocation(raw, locationId));
}

export function inferLocationIdFromExercises(exercises: string[]): LocationId {
  if (exercises.length === 0) return "unknown";

  const lowered = exercises.map((x) => x.trim().toLowerCase());

  if (lowered.every((x) => x.startsWith("pf "))) return "planet-fitness";
  if (lowered.every((x) => x.startsWith("work ") || x.startsWith("gwork "))) {
    return "work";
  }
  if (lowered.every((x) => x.startsWith("run"))) return "street";

  return "unknown";
}

export function stripLocationPrefix(raw: string): string {
  let value = raw.trim();
  for (const prefix of LOCATION_PREFIXES) {
    value = value.replace(prefix, "");
  }
  return value.trim();
}
