import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { classifyPillar, GoodNews, Pillar, todayKey } from "@/app/lib/perma";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "goodnews.json");

// A few other visitors' notes, so the first visitor still finds an exchange.
const SEEDS: Omit<GoodNews, "day" | "createdAt">[] = [
  { id: "seed-1", clientId: "seed", pillar: "positive",       text: "楼下的桂花开了，路过时香了一整条街。" },
  { id: "seed-2", clientId: "seed", pillar: "positive",       text: "午后下了场雨，空气里都是晴天的味道。" },
  { id: "seed-3", clientId: "seed", pillar: "engagement",     text: "练了一个月的曲子，今天第一次完整弹下来。" },
  { id: "seed-4", clientId: "seed", pillar: "engagement",     text: "读一本小说读到忘了吃饭，很久没有这样了。" },
  { id: "seed-5", clientId: "seed", pillar: "relationships",  text: "和很久没联系的老朋友通了电话，像昨天才见过。" },
  { id: "seed-6", clientId: "seed", pillar: "relationships",  text: "妈妈寄来的箱子里，塞了一罐她自己腌的梅子。" },
  { id: "seed-7", clientId: "seed", pillar: "meaning",        text: "帮一位迷路的老人找到了地铁口，他说了三次谢谢。" },
  { id: "seed-8", clientId: "seed", pillar: "meaning",        text: "把不穿的大衣洗净捐了出去，希望它过个暖冬。" },
  { id: "seed-9", clientId: "seed", pillar: "accomplishment", text: "拖了半年的体检终于做完了，一切都好。" },
  { id: "seed-10", clientId: "seed", pillar: "accomplishment", text: "今天跑完了人生第一个五公里，很慢，但跑完了。" },
];

async function loadStore(): Promise<GoodNews[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function saveStore(list: GoodNews[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
}

function seedPool(): GoodNews[] {
  const now = Date.now();
  return SEEDS.map(s => ({ ...s, day: todayKey(), createdAt: now }));
}

// Pick an exchange: another visitor's note from the same pillar, newest first.
function findMatch(list: GoodNews[], pillar: Pillar, clientId: string): GoodNews | null {
  const candidates = list
    .filter(n => n.pillar === pillar && n.clientId !== clientId)
    .sort((a, b) => b.createdAt - a.createdAt);
  if (candidates.length) return candidates[0];
  const seeds = seedPool().filter(s => s.pillar === pillar);
  return seeds.length ? seeds[Math.floor(Math.random() * seeds.length)] : null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientId = (url.searchParams.get("clientId") ?? "").slice(0, 64);
  const list = await loadStore();
  const today = todayKey();
  const mine = clientId
    ? list.find(n => n.clientId === clientId && n.day === today) ?? null
    : null;
  const match = mine ? findMatch(list, mine.pillar, clientId) : null;
  return NextResponse.json({ today, mine, match });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string; clientId?: string };
    const text = String(body.text ?? "").trim().slice(0, 280);
    const clientId = String(body.clientId ?? "").trim().slice(0, 64);
    if (!text) {
      return NextResponse.json({ error: "empty note" }, { status: 400 });
    }
    if (!clientId) {
      return NextResponse.json({ error: "missing clientId" }, { status: 400 });
    }

    const list = await loadStore();
    const today = todayKey();
    const existing = list.find(n => n.clientId === clientId && n.day === today);
    if (existing) {
      const match = findMatch(list, existing.pillar, clientId);
      return NextResponse.json({ mine: existing, match, already: true });
    }

    const pillar = classifyPillar(text);
    const mine: GoodNews = {
      id: `gn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      clientId,
      text,
      pillar,
      day: today,
      createdAt: Date.now(),
    };
    list.push(mine);
    await saveStore(list);

    const match = findMatch(list, pillar, clientId);
    return NextResponse.json({ mine, match, already: false });
  } catch (err) {
    console.error("goodnews error", err);
    return NextResponse.json({ error: "the garden is quiet for a moment" }, { status: 500 });
  }
}
