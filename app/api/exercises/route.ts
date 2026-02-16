import { NextResponse } from "next/server";
import { createExercise, listExercises } from "@/lib/sessions-repo";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const limit = Number(url.searchParams.get("limit") || "30");
    const exercises = await listExercises(q, Math.max(1, Math.min(200, limit)));
    return NextResponse.json({ exercises });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string; aliases?: string[]; iconKey?: string };
    const name = (body.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const exercise = await createExercise({
      name,
      aliases: (body.aliases || []).map((x) => x.trim()).filter(Boolean),
      iconKey: body.iconKey?.trim(),
    });

    return NextResponse.json({ exercise }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
