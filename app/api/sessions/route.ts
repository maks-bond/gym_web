import { NextResponse } from "next/server";
import { getSession, listLocations, listSessions, upsertSessionV2 } from "@/lib/sessions-repo";

const USER_ID = "me";

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseAndValidate(body: {
  sessionDate?: string;
  locationId?: string;
  exerciseIds?: string[];
  notesRaw?: string;
}) {
  const sessionDate = (body.sessionDate || "").trim();
  const locationId = (body.locationId || "unknown").trim();
  const exerciseIds = (body.exerciseIds || []).map((x) => x.trim()).filter(Boolean);

  if (!isIsoDate(sessionDate)) {
    return { error: "sessionDate must be YYYY-MM-DD" };
  }

  if (exerciseIds.length === 0) {
    return { error: "At least one exercise is required" };
  }

  return { sessionDate, locationId, exerciseIds, notesRaw: body.notesRaw };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionDate = (url.searchParams.get("sessionDate") || "").trim();

    if (sessionDate) {
      if (!isIsoDate(sessionDate)) {
        return NextResponse.json(
          { error: "sessionDate must be YYYY-MM-DD" },
          { status: 400 },
        );
      }

      const session = await getSession(USER_ID, sessionDate);
      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      return NextResponse.json({ session });
    }

    const sessions = await listSessions(USER_ID);
    return NextResponse.json({ sessions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const parsed = parseAndValidate((await req.json()) as {
      sessionDate?: string;
      locationId?: string;
      exerciseIds?: string[];
      notesRaw?: string;
    });

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const validLocationIds = new Set((await listLocations()).map((x) => x.locationId));
    if (!validLocationIds.has(parsed.locationId)) {
      return NextResponse.json(
        { error: `Invalid locationId: ${parsed.locationId}` },
        { status: 400 },
      );
    }

    const session = await upsertSessionV2({
      userId: USER_ID,
      sessionDate: parsed.sessionDate,
      locationId: parsed.locationId,
      exerciseItems: parsed.exerciseIds.map((exerciseId) => ({ exerciseId })),
      notesRaw: parsed.notesRaw,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const parsed = parseAndValidate((await req.json()) as {
      sessionDate?: string;
      locationId?: string;
      exerciseIds?: string[];
      notesRaw?: string;
    });

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const validLocationIds = new Set((await listLocations()).map((x) => x.locationId));
    if (!validLocationIds.has(parsed.locationId)) {
      return NextResponse.json(
        { error: `Invalid locationId: ${parsed.locationId}` },
        { status: 400 },
      );
    }

    const session = await upsertSessionV2({
      userId: USER_ID,
      sessionDate: parsed.sessionDate,
      locationId: parsed.locationId,
      exerciseItems: parsed.exerciseIds.map((exerciseId) => ({ exerciseId })),
      notesRaw: parsed.notesRaw,
    });

    return NextResponse.json({ session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
