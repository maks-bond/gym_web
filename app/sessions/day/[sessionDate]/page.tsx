import Link from "next/link";
import { redirect } from "next/navigation";
import { listSessions } from "@/lib/sessions-repo";

const USER_ID = "me";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    sessionDate: string;
  }>;
};

export default async function SessionDayPage({ params }: Props) {
  const { sessionDate } = await params;
  const sessions = (await listSessions(USER_ID)).filter((x) => x.sessionDate === sessionDate);

  if (sessions.length === 0) {
    redirect(`/new?date=${sessionDate}`);
  }

  return (
    <section>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>{sessionDate}</h2>
        <Link href={`/new?date=${sessionDate}`} className="button button-link button-small">
          Add
        </Link>
      </div>

      {sessions.map((session, idx) => (
        <article key={`${session.userId}-${session.sessionDate}-${idx}`} className="card">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h3>
              Session {idx + 1} <span style={{ color: "#4b5563" }}>({session.locationName})</span>
            </h3>
            <Link
              href={`/sessions/${session.sessionDate}/edit`}
              className="button button-link button-small"
            >
              Edit
            </Link>
          </div>
          <ul>
            {session.exerciseItems.map((exercise, i) => (
              <li key={`${session.sessionDate}-${exercise.exerciseId}-${i}`}>{exercise.name}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
