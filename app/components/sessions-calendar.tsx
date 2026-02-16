"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  sessionDates: string[];
};

function parseIsoLocal(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  return new Date(year, month, day);
}

export default function SessionsCalendar({ sessionDates }: Props) {
  const router = useRouter();
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const date of sessionDates) {
      map.set(date, (map.get(date) || 0) + 1);
    }
    return map;
  }, [sessionDates]);

  const label = viewMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();
  const firstDayIndex = (firstDay.getDay() + 6) % 7;

  const cells: Array<{ key: string; day?: number; iso?: string; count?: number }> = [];

  for (let i = 0; i < firstDayIndex; i += 1) {
    cells.push({ key: `pad-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ key: iso, day, iso, count: counts.get(iso) || 0 });
  }

  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const exercisedThisMonth = sessionDates.filter((d) => {
    const parsed = parseIsoLocal(d);
    return (
      parsed &&
      parsed.getFullYear() === viewMonth.getFullYear() &&
      parsed.getMonth() === viewMonth.getMonth()
    );
  }).length;

  return (
    <article className="card">
      <div className="calendar-top">
        <button
          type="button"
          className="button button-small"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          aria-label="Previous month"
        >
          ←
        </button>
        <strong>{label}</strong>
        <button
          type="button"
          className="button button-small"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <p className="helper">Days exercised this month: {exercisedThisMonth}</p>

      <div className="calendar-grid calendar-weekdays">
        {weekdayLabels.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((cell) => (
          <button
            key={cell.key}
            type="button"
            disabled={!cell.day}
            className={`calendar-cell calendar-cell-button ${cell.count ? "is-active" : ""} ${cell.day ? "" : "is-empty"}`}
            title={cell.iso && cell.count ? `${cell.iso}: workout` : cell.iso || ""}
            onClick={() => {
              if (!cell.iso) return;
              if ((cell.count || 0) > 0) {
                router.push(`/sessions/day/${cell.iso}`);
              } else {
                router.push(`/new?date=${cell.iso}`);
              }
            }}
          >
            {cell.day ? <span>{cell.day}</span> : null}
          </button>
        ))}
      </div>
    </article>
  );
}
