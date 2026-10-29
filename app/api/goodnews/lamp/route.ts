import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { GoodNews } from "@/app/lib/perma";

export const runtime = "nodejs";

const DATA_FILE = path.join(process.cwd(), "data", "goodnews.json");

// Light a lamp back for someone else's good news.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { id?: string; clientId?: string };
    const id = String(body.id ?? "").slice(0, 64);
    const clientId = String(body.clientId ?? "").trim().slice(0, 64);
    if (!id || !clientId) {
      return NextResponse.json({ error: "missing id or clientId" }, { status: 400 });
    }

    let list: GoodNews[] = [];
    try {
      list = JSON.parse(await fs.readFile(DATA_FILE, "utf-8"));
    } catch {}
    const note = list.find(n => n.id === id);
    // seed notes are not in the store; accept silently so the gesture still lands
    if (!note) return NextResponse.json({ lit: true, litCount: 1 });
    if (note.clientId === clientId) {
      return NextResponse.json({ error: "cannot light your own lamp" }, { status: 400 });
    }

    note.litBy = note.litBy ?? [];
    if (!note.litBy.includes(clientId)) {
      note.litBy.push(clientId);
      await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
    }
    return NextResponse.json({ lit: true, litCount: note.litBy.length });
  } catch (err) {
    console.error("lamp error", err);
    return NextResponse.json({ error: "the lamp flickers" }, { status: 500 });
  }
}
