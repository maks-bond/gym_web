const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const OUT_OF_ORDER_DAY_TOLERANCE = 45;

function toIsoDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeDateLabel(monthDay: string): string {
  return monthDay
    .trim()
    .replace(/^T(?=[A-Za-z])/, "")
    .replace(/:$/, "")
    .replace(/\s+/g, " ");
}

function parseMonthDay(monthDay: string): { month: number; day: number } {
  const cleaned = normalizeDateLabel(monthDay);
  const match = cleaned.match(/^([A-Za-z]{3,})\s+(\d{1,2})$/);
  if (!match) {
    throw new Error(`Invalid date format: ${monthDay}`);
  }

  const monthKey = match[1].slice(0, 3).toLowerCase();
  const month = MONTHS[monthKey];
  const day = Number(match[2]);

  if (month === undefined || Number.isNaN(day) || day < 1 || day > 31) {
    throw new Error(`Invalid date value: ${monthDay}`);
  }

  return { month, day };
}

export function isSupportedMonthDayLabel(value: string): boolean {
  try {
    parseMonthDay(value);
    return true;
  } catch {
    return false;
  }
}

export function parseMonthDayToIso(
  monthDay: string,
  previousIsoDate?: string,
  now: Date = new Date(),
): string {
  const { month, day } = parseMonthDay(monthDay);

  let year = now.getUTCFullYear();
  let candidate = new Date(Date.UTC(year, month, day));

  if (!previousIsoDate) {
    const nowUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    if (candidate.getTime() > nowUtc.getTime()) {
      year -= 1;
      candidate = new Date(Date.UTC(year, month, day));
    }
    return toIsoDateUTC(candidate);
  }

  const previous = new Date(`${previousIsoDate}T00:00:00Z`);
  year = previous.getUTCFullYear();
  candidate = new Date(Date.UTC(year, month, day));
  const diffDays = Math.floor(
    (candidate.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays > OUT_OF_ORDER_DAY_TOLERANCE) {
    year -= 1;
    candidate = new Date(Date.UTC(year, month, day));
  }

  return toIsoDateUTC(candidate);
}
