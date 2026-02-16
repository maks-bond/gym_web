import { listSessions } from "@/lib/sessions-repo";

const USER_ID = "me";

export default async function HomePage() {
  const sessions = await listSessions(USER_ID);

  return (
    <section>
      <h2>All Sessions</h2>
      {sessions.length === 0 ? <p>No sessions yet.</p> : null}
      {sessions.map((session) => (
        <article key={`${session.userId}-${session.sessionDate}`} className="card">
          <h3>{session.sessionDate}</h3>
          <ul>
            {session.exercises.map((exercise, idx) => (
              <li key={`${session.sessionDate}-${idx}`}>{exercise}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
