import { NextResponse } from "next/server";
import { lastNotesByExercise } from "@/lib/sessions-repo";

const USER_ID = "me";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const lastNotes = await lastNotesByExercise(USER_ID);
    return NextResponse.json({ lastNotes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
