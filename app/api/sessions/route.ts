import { NextResponse } from "next/server";
import { listSessions, upsertSession } from "@/lib/sessions-repo";

const USER_ID = "me";

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET() {
  try {
    const sessions = await listSessions(USER_ID);
    return NextResponse.json({ sessions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      sessionDate?: string;
      exercises?: string[];
      notesRaw?: string;
    };

    const sessionDate = (body.sessionDate || "").trim();
    const exercises = (body.exercises || []).map((x) => x.trim()).filter(Boolean);

    if (!isIsoDate(sessionDate)) {
      return NextResponse.json(
        { error: "sessionDate must be YYYY-MM-DD" },
        { status: 400 },
      );
    }

    if (exercises.length === 0) {
      return NextResponse.json(
        { error: "At least one exercise is required" },
        { status: 400 },
      );
    }

    const session = await upsertSession(USER_ID, sessionDate, exercises, body.notesRaw);
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
