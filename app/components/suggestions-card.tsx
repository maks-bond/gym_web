import Link from "next/link";
import type { Suggestions } from "@/lib/muscles";

function ago(days: number | null): string {
  if (days === null) return "never";
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function SuggestionsCard({ suggestions }: { suggestions: Suggestions }) {
  const { nextUp, rotation, lastCardioDaysAgo } = suggestions;
  if (!nextUp) return null;

  return (
    <details className="card suggest-card">
      <summary>
        <strong>Next up: {nextUp.groups.join(" + ")}</strong>
        <span className="helper"> · last {ago(nextUp.daysAgo)}</span>
      </summary>

      <div className="suggest-row" style={{ marginTop: 8 }}>
        <p className="helper" style={{ marginTop: 0 }}>
          {nextUp.exampleExercises.join(", ")}
        </p>
        <Link
          href={`/new?from=${encodeURIComponent(nextUp.exampleSessionId)}`}
          className="button button-link button-small"
        >
          Start
        </Link>
      </div>

      {rotation.length > 1 ? (
        <p className="helper">
          Rotation:{" "}
          {rotation.map((day, i) => (
            <span key={day.groups.join("+")}>
              {i > 0 ? " · " : ""}
              <Link href={`/new?from=${encodeURIComponent(day.exampleSessionId)}`}>
                {day.groups.join("+")}
              </Link>{" "}
              ({day.daysAgo}d)
            </span>
          ))}
          {lastCardioDaysAgo !== null ? ` · cardio (${lastCardioDaysAgo}d)` : null}
        </p>
      ) : null}
    </details>
  );
}
