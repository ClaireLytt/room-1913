"use client";
import { useEffect, useState } from "react";
import SessionRail from "../components/SessionRail";
import WindowDateChip from "../components/WindowDateChip";
import {
  FIVE_QUESTIONS,
  PILLARS,
  PILLAR_LABEL,
  Pillar,
  GoodNews,
  scoreAnswer,
} from "../lib/perma";
import {
  GoodThing,
  GoodThingsEntry,
  loadGoodThings,
  saveEntry,
  todayEntry,
  streakOf,
} from "../lib/goodthings";
import {
  STYLE_DIMENSIONS,
  STYLE_ITEMS,
  STYLE_LABEL,
  scoreStyle,
  styleVerdict,
} from "../lib/optimism";
import {
  Strength,
  STRENGTH_CARDS,
  STRENGTH_LABEL,
  topStrengths,
} from "../lib/strengths";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

function Calendar({ history }: { history: GoodNews[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [picked, setPicked] = useState<GoodNews | null>(null);

  const byDay = new Map<string, GoodNews>();
  for (const n of history) byDay.set(n.day, n);

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const key = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const shift = (delta: number) => {
    const m = new Date(year, month + delta, 1);
    setYear(m.getFullYear());
    setMonth(m.getMonth());
    setPicked(null);
  };

  return (
    <div className="garden-cal">
      <div className="garden-cal-head">
        <button className="garden-cal-nav font-type" onClick={() => shift(-1)}>‹</button>
        <span className="garden-cal-title font-type">{year} · {month + 1}月</span>
        <button className="garden-cal-nav font-type" onClick={() => shift(1)}>›</button>
      </div>
      <div className="garden-cal-grid">
        {WEEKDAYS.map(w => (
          <span key={w} className="garden-cal-weekday font-type">{w}</span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`x${i}`} />;
          const note = byDay.get(key(d));
          return (
            <button
              key={d}
              className={`garden-cal-day font-type ${note ? "garden-cal-day-bloom" : ""} ${picked && note === picked ? "garden-cal-day-on" : ""}`}
              style={note ? { color: PILLAR_COLOR[note.pillar] } : undefined}
              onClick={() => note && setPicked(picked === note ? null : note)}
              disabled={!note}
            >
              {note ? "✻" : d}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="garden-card" style={{ marginTop: "12px" }}>
          <p className="garden-card-tag font-type">
            {picked.day} · {PILLAR_LABEL[picked.pillar].letter} {PILLAR_LABEL[picked.pillar].zh}
          </p>
          <p className="garden-card-text font-serif">“{picked.text}”</p>
        </div>
      )}
    </div>
  );
}

const PILLAR_COLOR: Record<Pillar, string> = {
  positive: "#d99a4e",
  engagement: "#c9b36a",
  relationships: "#9fb88a",
  meaning: "#b87a4a",
  accomplishment: "#e0cfa8",
};

function Flower({ pillar, i }: { pillar: Pillar; i: number }) {
  const color = PILLAR_COLOR[pillar];
  const h = 34 + ((i * 7) % 18); // uneven heights, like a real bed
  const sway = (i % 5) - 2;
  return (
    <svg
      className="garden-flower"
      viewBox="0 0 24 60"
      style={{ height: `${h + 22}px` }}
      aria-label={PILLAR_LABEL[pillar].zh}
    >
      <path
        d={`M12 58 Q ${12 + sway} ${58 - h / 2} 12 ${58 - h}`}
        stroke="rgba(159,184,138,0.55)"
        strokeWidth="1.4"
        fill="none"
      />
      <g transform={`translate(12 ${58 - h})`}>
        {[0, 72, 144, 216, 288].map(a => (
          <ellipse
            key={a}
            cx="0"
            cy="-4.4"
            rx="2.6"
            ry="4.4"
            fill={color}
            opacity="0.82"
            transform={`rotate(${a + sway * 4})`}
          />
        ))}
        <circle r="2.2" fill="rgba(26,20,14,0.9)" stroke={color} strokeWidth="0.8" />
      </g>
    </svg>
  );
}

function Lamp({ streak }: { streak: number }) {
  // the longer the streak, the brighter the lamp burns
  const glow = Math.min(1, 0.25 + streak * 0.12);
  return (
    <span className="garden-lamp" aria-label={`连续 ${streak} 天`}>
      <svg viewBox="0 0 24 34" style={{ filter: `drop-shadow(0 0 ${4 + streak * 2}px rgba(217,154,78,${glow}))` }}>
        <path d="M8 20h8l-1.5 10h-5Z" fill="none" stroke="rgba(217,154,78,0.6)" strokeWidth="1.2" />
        <path
          d="M12 6 C 15 10, 15.5 13, 12 17 C 8.5 13, 9 10, 12 6 Z"
          fill={`rgba(217,154,78,${glow})`}
          stroke="rgba(232,220,196,0.5)"
          strokeWidth="0.6"
        />
      </svg>
      <span className="garden-lamp-count font-type">{streak}</span>
    </span>
  );
}

import Breathing from "../components/Breathing";

const CLIENT_KEY = "room1913.garden.client.v1";
const ANSWERS_KEY = "room1913.garden.answers.v1";
const OPTIMISM_KEY = "room1913.garden.optimism.v1";
const STRENGTHS_KEY = "room1913.garden.strengths.v1";
const LAMPSEEN_KEY = "room1913.garden.lampseen.v1";

const NAV = [
  { id: "news", zh: "好消息" },
  { id: "breath", zh: "呼吸" },
  { id: "things", zh: "三件好事" },
  { id: "optimism", zh: "乐观" },
  { id: "strengths", zh: "优势" },
  { id: "questions", zh: "五问" },
  { id: "bottle", zh: "瓶中信" },
];

function getClientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

function PastNights({
  entries,
  open,
  toggle,
}: {
  entries: GoodThingsEntry[];
  open: boolean;
  toggle: () => void;
}) {
  if (!entries.length) return null;
  return (
    <div className="garden-past">
      <button className="garden-game-back font-type" onClick={toggle}>
        {open ? "‹ 收起往夜的记录" : `往夜的记录 · ${entries.length} 晚 ›`}
      </button>
      {open && (
        <ul className="garden-past-list">
          {entries.map(e => (
            <li key={e.day} className="garden-card">
              <p className="garden-card-tag font-type">{e.day}</p>
              {e.items.map((t, i) => (
                <p key={i} className="garden-past-line font-serif">
                  {t.text}
                  {t.why ? <span className="ink-fade"> —— {t.why}</span> : null}
                </p>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Garden() {
  // --- five questions ---
  const [answers, setAnswers] = useState<Record<Pillar, string>>(
    () => Object.fromEntries(PILLARS.map(p => [p, ""])) as Record<Pillar, string>
  );
  const [revealed, setRevealed] = useState(false);

  // --- daily good news ---
  const [clientId, setClientId] = useState("");
  const [note, setNote] = useState("");
  const [mine, setMine] = useState<GoodNews | null>(null);
  const [match, setMatch] = useState<GoodNews | null>(null);
  const [history, setHistory] = useState<GoodNews[]>([]);
  const [busy, setBusy] = useState(false);

  // --- lamp back ---
  const [matchLit, setMatchLit] = useState(false);

  // --- optimism game ---
  const [picks, setPicksState] = useState<boolean[]>([]);
  const setPicks = (updater: (prev: boolean[]) => boolean[]) =>
    setPicksState(prev => {
      const next = updater(prev);
      try { localStorage.setItem(OPTIMISM_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  const gameDone = picks.length >= STYLE_ITEMS.length;
  const current = STYLE_ITEMS[picks.length];
  const result = scoreStyle(picks);

  // --- character strengths ---
  const [strengthPicks, setStrengthPicksState] = useState<Strength[]>([]);
  const setStrengthPicks = (updater: (prev: Strength[]) => Strength[]) =>
    setStrengthPicksState(prev => {
      const next = updater(prev);
      try { localStorage.setItem(STRENGTHS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  const strengthsDone = strengthPicks.length >= STRENGTH_CARDS.length;
  const strengthCard = STRENGTH_CARDS[strengthPicks.length];
  const top3 = topStrengths(strengthPicks);

  // --- bottle post ---
  const [bottleText, setBottleText] = useState("");
  const [bottleReceived, setBottleReceived] = useState<string | null>(null);
  const [bottleBusy, setBottleBusy] = useState(false);

  // --- three good things ---
  const [things, setThings] = useState<GoodThing[]>(
    () => [0, 1, 2].map(() => ({ text: "", why: "" }))
  );
  const [entries, setEntries] = useState<GoodThingsEntry[]>([]);
  const savedToday = todayEntry(entries);
  const streak = streakOf(entries);
  const pastEntries = entries
    .filter(e => e !== savedToday)
    .sort((a, b) => b.createdAt - a.createdAt);
  const [showPast, setShowPast] = useState(false);

  // --- lamp echo ---
  const [lampEcho, setLampEcho] = useState(0);

  useEffect(() => {
    const id = getClientId();
    setClientId(id);
    try {
      const saved = localStorage.getItem(ANSWERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setAnswers(prev => ({ ...prev, ...parsed }));
      }
    } catch {}
    setEntries(loadGoodThings());
    try {
      const op = JSON.parse(localStorage.getItem(OPTIMISM_KEY) ?? "[]");
      if (Array.isArray(op)) setPicksState(op.filter(v => typeof v === "boolean"));
      const st = JSON.parse(localStorage.getItem(STRENGTHS_KEY) ?? "[]");
      if (Array.isArray(st)) setStrengthPicksState(st);
    } catch {}
    fetch(`/api/goodnews?clientId=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => {
        if (d.mine) { setMine(d.mine); setMatch(d.match ?? null); }
        if (Array.isArray(d.history)) {
          setHistory(d.history);
          const lit = d.history.reduce(
            (n: number, g: GoodNews) => n + (g.litBy?.length ?? 0), 0
          );
          try {
            const seen = Number(localStorage.getItem(LAMPSEEN_KEY) ?? "0");
            if (lit > seen) setLampEcho(lit - seen);
            localStorage.setItem(LAMPSEEN_KEY, String(lit));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const setThing = (i: number, field: keyof GoodThing, v: string) => {
    setThings(prev => prev.map((t, j) => (j === i ? { ...t, [field]: v } : t)));
  };
  const thingsComplete = things.every(t => t.text.trim().length > 0);

  const lightLamp = async () => {
    if (!match || matchLit) return;
    setMatchLit(true); // the gesture lands immediately; server call follows
    try {
      await fetch("/api/goodnews/lamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: match.id, clientId }),
      });
    } catch {}
  };
  const lampsReceived = history.reduce((n, g) => n + (g.litBy?.length ?? 0), 0);

  const castBottle = async () => {
    const text = bottleText.trim();
    if (!text || bottleBusy) return;
    setBottleBusy(true);
    try {
      const res = await fetch("/api/bottle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, clientId }),
      });
      const d = await res.json();
      if (d.cast) {
        setBottleReceived(d.received?.text ?? null);
        setBottleText("");
      }
    } catch {}
    setBottleBusy(false);
  };
  const saveThings = () => {
    if (!thingsComplete) return;
    setEntries(saveEntry(things.map(t => ({ text: t.text.trim(), why: t.why.trim() }))));
  };

  const setAnswer = (p: Pillar, v: string) => {
    setAnswers(prev => {
      const next = { ...prev, [p]: v };
      try { localStorage.setItem(ANSWERS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const answeredAll = PILLARS.every(p => answers[p].trim().length > 0);
  const scores = Object.fromEntries(
    PILLARS.map(p => [p, scoreAnswer(p, answers[p])])
  ) as Record<Pillar, number>;

  const share = async () => {
    const text = note.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/goodnews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, clientId }),
      });
      const d = await res.json();
      if (d.mine) {
        setMine(d.mine);
        setMatch(d.match ?? null);
        setNote("");
        if (!d.already) setHistory(prev => [...prev, d.mine]);
      }
    } catch {}
    setBusy(false);
  };

  return (
    <main className="archive-shell">
      <SessionRail active="garden" />

      <section className="archive-stage">
        <header className="archive-stage-head">
          <h1 className="archive-stage-title font-serif">GARDEN</h1>
          <p className="archive-stage-sub font-serif ink-fade">
            五个问题认识自己，一条好消息交换陌生的善意
          </p>
          <nav className="garden-nav" aria-label="garden sections">
            {NAV.map(n => (
              <a key={n.id} href={`#${n.id}`} className="garden-nav-item font-type">
                {n.zh}
              </a>
            ))}
          </nav>
          {lampEcho > 0 && (
            <p className="garden-echo font-serif">
              你不在的时候，有人为你的好消息点亮了 {lampEcho} 盏灯。
            </p>
          )}
        </header>

        {/* ----- daily good news ----- */}
        <section className="garden-block" id="news">
          <h2 className="garden-block-title font-type">TODAY&apos;S GOOD NEWS · 今日好消息</h2>

          {mine ? (
            <div className="garden-exchange">
              <div className="garden-card garden-card-mine">
                <p className="garden-card-tag font-type">
                  YOURS · {PILLAR_LABEL[mine.pillar].letter} {PILLAR_LABEL[mine.pillar].zh}
                </p>
                <p className="garden-card-text font-serif">“{mine.text}”</p>
                {lampsReceived > 0 && (
                  <p className="garden-hint font-serif ink-fade">
                    你的好消息照亮过 {lampsReceived} 位访客。
                  </p>
                )}
              </div>
              {match ? (
                <div className="garden-card garden-card-match">
                  <p className="garden-card-tag font-type">
                    IN EXCHANGE · 来自另一位访客
                  </p>
                  <p className="garden-card-text font-serif">“{match.text}”</p>
                  <button
                    className={`garden-lamp-btn font-type ${matchLit ? "garden-lamp-btn-lit" : ""}`}
                    onClick={lightLamp}
                    disabled={matchLit}
                  >
                    {matchLit ? "灯已点亮 · 对方会看到" : "点一盏灯回赠"}
                  </button>
                </div>
              ) : (
                <p className="garden-hint font-serif italic ink-mute">
                  还没有同类的好消息经过，花园会替你留意。
                </p>
              )}
              <p className="garden-hint font-serif ink-fade">
                今天的好消息已放进花园，明天再来交换一条。
              </p>
            </div>
          ) : (
            <div className="garden-share">
              <textarea
                className="garden-input font-serif"
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={280}
                rows={3}
                placeholder="写下今天一件很小的好事……"
              />
              <button
                className="garden-btn font-type"
                onClick={share}
                disabled={!note.trim() || busy}
              >
                {busy ? "SENDING…" : "SHARE · 放进花园"}
              </button>
            </div>
          )}
          {history.length > 0 && (
            <div className="garden-bed">
              <div className="garden-bed-row">
                {history.map((n, i) => (
                  <Flower key={n.id} pillar={n.pillar} i={i} />
                ))}
              </div>
              <div className="garden-bed-ground" />
              <p className="garden-hint font-serif ink-fade">
                你的花坛 · 每一朵都是一条分享过的好消息
              </p>
              <Calendar history={history} />
            </div>
          )}
        </section>

        {/* ----- breathing ----- */}
        <section className="garden-block" id="breath">
          <h2 className="garden-block-title font-type">BREATHING · 呼吸窗</h2>
          <p className="garden-hint font-serif ink-fade" style={{ margin: "0 0 14px" }}>
            4-7-8：吸气四拍，屏息七拍，呼气八拍。让房间暗下来，只剩雨声和一圈灯光。
          </p>
          <Breathing
            onFinish={() =>
              document.getElementById("news")?.scrollIntoView({ behavior: "smooth" })
            }
          />
        </section>

        {/* ----- three good things ----- */}
        <section className="garden-block" id="things">
          <h2 className="garden-block-title font-type">
            THREE GOOD THINGS · 今晚的三件好事
            <Lamp streak={streak} />
          </h2>

          {savedToday ? (
            <div className="garden-exchange">
              <ul className="garden-things-done">
                {savedToday.items.map((t, i) => (
                  <li key={i} className="garden-card">
                    <p className="garden-card-tag font-type">NO. {i + 1}</p>
                    <p className="garden-card-text font-serif">{t.text}</p>
                    {t.why && (
                      <p className="garden-things-why font-serif ink-fade">为什么会发生：{t.why}</p>
                    )}
                  </li>
                ))}
              </ul>
              <p className="garden-hint font-serif ink-fade">
                已记下，油灯为你亮着——连续 {streak} 天。
              </p>
              <PastNights entries={pastEntries} open={showPast} toggle={() => setShowPast(v => !v)} />
            </div>
          ) : (
            <div className="garden-share">
              <p className="garden-hint font-serif ink-fade" style={{ margin: "0 0 14px" }}>
                睡前写下今天的三件好事，以及它们为什么会发生。
              </p>
              <ul className="garden-things-list">
                {things.map((t, i) => (
                  <li key={i} className="garden-things-item">
                    <span className="garden-q-letter font-type">{i + 1}</span>
                    <div className="garden-things-fields">
                      <input
                        className="garden-input font-serif"
                        value={t.text}
                        onChange={e => setThing(i, "text", e.target.value)}
                        placeholder="发生了什么好事"
                      />
                      <input
                        className="garden-input font-serif garden-things-why-input"
                        value={t.why}
                        onChange={e => setThing(i, "why", e.target.value)}
                        placeholder="它为什么会发生（可留空）"
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <button
                className="garden-btn font-type"
                onClick={saveThings}
                disabled={!thingsComplete}
              >
                KEEP · 记下这三件
              </button>
              <PastNights entries={pastEntries} open={showPast} toggle={() => setShowPast(v => !v)} />
            </div>
          )}
        </section>

        {/* ----- optimism game ----- */}
        <section className="garden-block" id="optimism">
          <h2 className="garden-block-title font-type">LEARNED OPTIMISM · 乐观解释风格</h2>

          {!gameDone && current ? (
            <div className="garden-game">
              <p className="garden-game-progress font-type">
                {picks.length + 1} / {STYLE_ITEMS.length}
              </p>
              <p className="garden-game-situation font-serif">{current.situation}</p>
              <p className="garden-hint font-serif ink-fade">此刻你心里的第一反应更接近哪一句？</p>
              <div className="garden-game-options">
                {current.options.map((o, i) => (
                  <button
                    key={i}
                    className="garden-game-option font-serif"
                    onClick={() => setPicks(prev => [...prev, o.optimistic])}
                  >
                    {o.text}
                  </button>
                ))}
              </div>
              {picks.length > 0 && (
                <button
                  className="garden-game-back font-type"
                  onClick={() => setPicks(prev => prev.slice(0, -1))}
                >
                  ‹ 上一题
                </button>
              )}
            </div>
          ) : (
            <div className="garden-perma">
              {STYLE_DIMENSIONS.map(d => {
                const r = result.byDimension[d];
                const pct = r.total ? Math.round((r.optimistic / r.total) * 100) : 0;
                return (
                  <div key={d} className="garden-perma-row">
                    <span className="garden-perma-label font-type">{STYLE_LABEL[d].zh}</span>
                    <span className="garden-perma-bar">
                      <span className="garden-perma-fill" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="garden-perma-score font-type">{r.optimistic}/{r.total}</span>
                  </div>
                );
              })}
              <p className="garden-card-text font-serif" style={{ marginTop: "10px" }}>
                {styleVerdict(result.overall)}
              </p>
              <p className="garden-hint font-serif ink-fade">
                条越满，说明你把挫折解释得越「暂时、局部、非全责」——这正是可以练习的乐观。
              </p>
              <button className="garden-btn font-type" onClick={() => setPicks(() => [])}>
                AGAIN · 再来一轮
              </button>
            </div>
          )}
        </section>

        {/* ----- character strengths ----- */}
        <section className="garden-block" id="strengths">
          <h2 className="garden-block-title font-type">SIGNATURE STRENGTHS · 品格优势</h2>

          {!strengthsDone && strengthCard ? (
            <div className="garden-game">
              <p className="garden-game-progress font-type">
                {strengthPicks.length + 1} / {STRENGTH_CARDS.length}
              </p>
              <p className="garden-hint font-serif ink-fade">哪一句更像你？</p>
              <div className="garden-game-options">
                <button
                  className="garden-game-option font-serif"
                  onClick={() => setStrengthPicks(prev => [...prev, strengthCard.a.strength])}
                >
                  {strengthCard.a.text}
                </button>
                <button
                  className="garden-game-option font-serif"
                  onClick={() => setStrengthPicks(prev => [...prev, strengthCard.b.strength])}
                >
                  {strengthCard.b.text}
                </button>
              </div>
              {strengthPicks.length > 0 && (
                <button
                  className="garden-game-back font-type"
                  onClick={() => setStrengthPicks(prev => prev.slice(0, -1))}
                >
                  ‹ 上一题
                </button>
              )}
            </div>
          ) : (
            <div className="garden-exchange">
              {top3.map((t, i) => (
                <div key={t.strength} className="garden-card">
                  <p className="garden-card-tag font-type">
                    NO. {i + 1} · {STRENGTH_LABEL[t.strength].zh}
                  </p>
                  <p className="garden-card-text font-serif">
                    {STRENGTH_LABEL[t.strength].desc}
                  </p>
                </div>
              ))}
              <p className="garden-hint font-serif ink-fade">
                这是你的签名优势——塞利格曼说，幸福不在修补短板，而在把它们用在每一天。
              </p>
              <button className="garden-btn font-type" onClick={() => setStrengthPicks(() => [])}>
                AGAIN · 再测一次
              </button>
            </div>
          )}
        </section>

        {/* ----- bottle post ----- */}
        <section className="garden-block" id="bottle">
          <h2 className="garden-block-title font-type">BOTTLE POST · 瓶中信</h2>
          {bottleReceived === null ? (
            <div className="garden-share">
              <p className="garden-hint font-serif ink-fade" style={{ margin: "0 0 14px" }}>
                写一句话，给同样在深夜打开这个房间的人。投进雨里，会有一只别人的瓶子漂到你脚边。
              </p>
              <textarea
                className="garden-input font-serif"
                value={bottleText}
                onChange={e => setBottleText(e.target.value)}
                maxLength={200}
                rows={2}
                placeholder="写给陌生夜航者的一句话……"
              />
              <button
                className="garden-btn font-type"
                onClick={castBottle}
                disabled={!bottleText.trim() || bottleBusy}
              >
                {bottleBusy ? "CASTING…" : "CAST · 投进雨里"}
              </button>
            </div>
          ) : (
            <div className="garden-exchange">
              <div className="garden-card garden-card-match">
                <p className="garden-card-tag font-type">WASHED ASHORE · 漂到你脚边的瓶子</p>
                <p className="garden-card-text font-serif">“{bottleReceived}”</p>
              </div>
              <p className="garden-hint font-serif ink-fade">
                你的瓶子也已经在雨里了，会在某个深夜漂到另一个人脚边。
              </p>
              <button
                className="garden-game-back font-type"
                onClick={() => setBottleReceived(null)}
              >
                再投一只
              </button>
            </div>
          )}
        </section>

        {/* ----- five questions ----- */}
        <section className="garden-block" id="questions">
          <h2 className="garden-block-title font-type">FIVE QUESTIONS · 认识自己的五个问题</h2>
          <ul className="garden-q-list">
            {FIVE_QUESTIONS.map((q, i) => (
              <li key={q.pillar} className="garden-q">
                <p className="garden-q-head font-serif">
                  <span className="garden-q-letter font-type">{PILLAR_LABEL[q.pillar].letter}</span>
                  {q.zh}
                  <span className="garden-q-en ink-mute"> {q.en}</span>
                </p>
                <input
                  className="garden-input font-serif"
                  value={answers[q.pillar]}
                  onChange={e => setAnswer(q.pillar, e.target.value)}
                  placeholder={`第 ${i + 1} 问，一句话即可`}
                />
              </li>
            ))}
          </ul>

          <button
            className="garden-btn font-type"
            onClick={() => setRevealed(true)}
            disabled={!answeredAll}
          >
            REVEAL · 看看我的五个支柱
          </button>

          {revealed && answeredAll && (
            <div className="garden-perma">
              {PILLARS.map(p => (
                <div key={p} className="garden-perma-row">
                  <span className="garden-perma-label font-type">
                    {PILLAR_LABEL[p].letter} · {PILLAR_LABEL[p].zh}
                  </span>
                  <span className="garden-perma-bar">
                    <span
                      className="garden-perma-fill"
                      style={{ width: `${scores[p]}%` }}
                    />
                  </span>
                  <span className="garden-perma-score font-type">{scores[p]}</span>
                </div>
              ))}
              <p className="garden-hint font-serif italic ink-fade">
                这不是测验，只是一面镜子——哪一栏最短，哪里就值得多浇一点水。
              </p>
            </div>
          )}
        </section>
      </section>

      <aside className="archive-window">
        <WindowDateChip />
        <p className="window-quote font-serif italic">
          “Well-being is not the absence of storms, but a garden kept through them.”
          <span className="window-quote-zh ink-fade font-serif">幸福不是无风无雨，而是一座被照料过的花园。</span>
        </p>
      </aside>
    </main>
  );
}
