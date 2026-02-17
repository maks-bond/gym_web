import { listSessions } from "@/lib/sessions-repo";
import Link from "next/link";
import SessionsCalendar from "./components/sessions-calendar";

const USER_ID = "me";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessions = await listSessions(USER_ID);

  return (
    <section>
      <SessionsCalendar sessionDates={sessions.map((x) => x.sessionDate)} />
      {sessions.length === 0 ? <p>No sessions yet.</p> : null}
      {sessions.map((session) => (
        <article key={`${session.userId}-${session.sessionId}`} className="card">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h3>
              {session.sessionDate} <span style={{ color: "#4b5563" }}>({session.locationName})</span>
            </h3>
            <Link
              href={`/sessions/${session.sessionId}/edit`}
              className="button button-link button-small"
            >
              Edit
            </Link>
          </div>
          <ul>
            {session.exerciseItems.map((exercise, idx) => (
              <li key={`${session.sessionDate}-${exercise.exerciseId}-${idx}`}>{exercise.name}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
