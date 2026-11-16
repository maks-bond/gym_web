import { NextResponse } from "next/server";
import {
  getSessionByDate,
  getSessionById,
  listLocations,
  listSessions,
  rankExercisesByUsage,
  upsertSessionV2,
} from "@/lib/sessions-repo";
import type { SessionExerciseItem } from "@/lib/types";

const USER_ID = "me";

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isIsoTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

type SessionBody = {
  sessionId?: string;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  locationId?: string;
  exerciseIds?: string[];
  exerciseItems?: Array<{ exerciseId?: string; notes?: string }>;
  notesRaw?: string;
};

function parseExerciseItems(body: SessionBody): SessionExerciseItem[] {
  const raw: Array<{ exerciseId?: string; notes?: string }> =
    body.exerciseItems || (body.exerciseIds || []).map((exerciseId) => ({ exerciseId }));
  return raw
    .map((x) => ({
      exerciseId: (x.exerciseId || "").trim(),
      notes: (x.notes || "").trim().slice(0, 500) || undefined,
    }))
    .filter((x) => x.exerciseId);
}

function parseAndValidate(body: SessionBody) {
  const sessionId = (body.sessionId || "").trim();
  const sessionDate = (body.sessionDate || "").trim();
  const startTime = (body.startTime || "").trim();
  const endTime = (body.endTime || "").trim();
  const locationId = (body.locationId || "unknown").trim();
  const exerciseItems = parseExerciseItems(body);

  if (!isIsoDate(sessionDate)) {
    return { error: "sessionDate must be YYYY-MM-DD" };
  }

  if (exerciseItems.length === 0) {
    return { error: "At least one exercise is required" };
  }

  if (startTime && !isIsoTime(startTime)) {
    return { error: "startTime must be HH:mm" };
  }
  if (endTime && !isIsoTime(endTime)) {
    return { error: "endTime must be HH:mm" };
  }

  return {
    sessionId,
    sessionDate,
    startTime: startTime || undefined,
    endTime: endTime || undefined,
    locationId,
    exerciseItems,
    notesRaw: body.notesRaw,
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = (url.searchParams.get("sessionId") || "").trim();
    const sessionDate = (url.searchParams.get("sessionDate") || "").trim();

    if (sessionId) {
      const session = await getSessionById(USER_ID, sessionId);
      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      return NextResponse.json({ session });
    }

    if (sessionDate) {
      if (!isIsoDate(sessionDate)) {
        return NextResponse.json(
          { error: "sessionDate must be YYYY-MM-DD" },
          { status: 400 },
        );
      }

      const session = await getSessionByDate(USER_ID, sessionDate);
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

async function saveSession(req: Request, status: number) {
  try {
    const parsed = parseAndValidate((await req.json()) as SessionBody);

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
      sessionId: parsed.sessionId || undefined,
      sessionDate: parsed.sessionDate,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      locationId: parsed.locationId,
      exerciseItems: parsed.exerciseItems,
      notesRaw: parsed.notesRaw,
    });

    // Keep exercise frequency fresh; a failure here must not fail the save.
    await rankExercisesByUsage(USER_ID).catch((err) => console.error("rank failed", err));

    return NextResponse.json({ session }, { status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return saveSession(req, 201);
}

export async function PUT(req: Request) {
  return saveSession(req, 200);
}
