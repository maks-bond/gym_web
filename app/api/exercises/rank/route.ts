import { NextResponse } from "next/server";
import { rankExercisesByUsage } from "@/lib/sessions-repo";

const USER_ID = "me";

export async function POST() {
  try {
    const { total, updated, ranked } = await rankExercisesByUsage(USER_ID);
    return NextResponse.json({ total, updated, exercises: ranked });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
