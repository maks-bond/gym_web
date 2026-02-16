import { NextResponse } from "next/server";
import { listLocations } from "@/lib/sessions-repo";

export async function GET() {
  try {
    const locations = await listLocations();
    return NextResponse.json({ locations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
