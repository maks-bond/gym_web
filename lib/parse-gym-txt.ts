import { isSupportedMonthDayLabel, parseMonthDayToIso } from "./date";

export type ParsedSession = {
  sessionDate: string;
  exercises: string[];
  notesRaw?: string;
};

function isDateLine(value: string): boolean {
  return isSupportedMonthDayLabel(value);
}

export function parseGymTxt(text: string, now: Date = new Date()): ParsedSession[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const withoutHeader = lines.filter((line, idx) => !(idx === 0 && /^gym$/i.test(line)));

  const sessions: ParsedSession[] = [];
  let i = 0;
  let previousIsoDate: string | undefined;

  while (i < withoutHeader.length) {
    const line = withoutHeader[i];

    if (!isDateLine(line)) {
      i += 1;
      continue;
    }

    const sessionDate = parseMonthDayToIso(line, previousIsoDate, now);
    previousIsoDate = sessionDate;
    i += 1;

    const exercises: string[] = [];
    while (i < withoutHeader.length && !isDateLine(withoutHeader[i])) {
      exercises.push(withoutHeader[i]);
      i += 1;
    }

    if (exercises.length > 0) {
      sessions.push({
        sessionDate,
        exercises,
        notesRaw: line,
      });
    }
  }

  return sessions;
}
