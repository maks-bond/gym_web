import { NextResponse } from "next/server";
import { listSessions, listLocations, upsertSessionV2 } from "@/lib/sessions-repo";

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
      locationId?: string;
      exerciseIds?: string[];
      notesRaw?: string;
    };

    const sessionDate = (body.sessionDate || "").trim();
    const locationId = (body.locationId || "unknown").trim();
    const exerciseIds = (body.exerciseIds || []).map((x) => x.trim()).filter(Boolean);

    if (!isIsoDate(sessionDate)) {
      return NextResponse.json(
        { error: "sessionDate must be YYYY-MM-DD" },
        { status: 400 },
      );
    }

    if (exerciseIds.length === 0) {
      return NextResponse.json(
        { error: "At least one exercise is required" },
        { status: 400 },
      );
    }

    const validLocationIds = new Set((await listLocations()).map((x) => x.locationId));
    if (!validLocationIds.has(locationId)) {
      return NextResponse.json(
        { error: `Invalid locationId: ${locationId}` },
        { status: 400 },
      );
    }

    const session = await upsertSessionV2({
      userId: USER_ID,
      sessionDate,
      locationId,
      exerciseItems: exerciseIds.map((exerciseId) => ({ exerciseId })),
      notesRaw: body.notesRaw,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
