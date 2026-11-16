import Link from "next/link";
import type { Suggestions } from "@/lib/muscles";

function ago(days: number | null): string {
  if (days === null) return "never";
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function SuggestionsCard({ suggestions }: { suggestions: Suggestions }) {
  const { nextUp, rotation, stale, lastCardioDaysAgo } = suggestions;
  if (!nextUp && stale.length === 0) return null;

  return (
    <article className="card">
      {nextUp ? (
        <div className="suggest-row">
          <div>
            <h3 style={{ marginBottom: 2 }}>Next up: {nextUp.groups.join(" + ")}</h3>
            <p className="helper" style={{ marginTop: 0 }}>
              {nextUp.exampleExercises.join(", ")} · last {ago(nextUp.daysAgo)}
            </p>
          </div>
          <Link
            href={`/new?from=${encodeURIComponent(nextUp.exampleSessionId)}`}
            className="button button-link button-small"
          >
            Start
          </Link>
        </div>
      ) : null}

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

      {stale.length > 0 ? (
        <p className="helper">
          Not trained lately:{" "}
          {stale.map((x) => `${x.group} (${x.daysAgo === null ? "never" : `${x.daysAgo}d`})`).join(", ")}
        </p>
      ) : null}
    </article>
  );
}
