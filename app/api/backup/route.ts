import { NextResponse } from "next/server";
import { createBackup, getBackup, listBackups } from "@/lib/sessions-repo";

const USER_ID = "me";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const backupId = (url.searchParams.get("backupId") || "").trim();
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || "30")));

    if (backupId) {
      const result = await getBackup(USER_ID, backupId);
      if (!result) {
        return NextResponse.json({ error: "Backup not found" }, { status: 404 });
      }
      return NextResponse.json(result);
    }

    const backups = await listBackups(USER_ID, limit);
    return NextResponse.json({ backups });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const backup = await createBackup(USER_ID);
    return NextResponse.json({ backup }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
