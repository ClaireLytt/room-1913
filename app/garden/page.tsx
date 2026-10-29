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

const CLIENT_KEY = "room1913.garden.client.v1";
const ANSWERS_KEY = "room1913.garden.answers.v1";

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
  const [busy, setBusy] = useState(false);

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
    fetch(`/api/goodnews?clientId=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => {
        if (d.mine) { setMine(d.mine); setMatch(d.match ?? null); }
      })
      .catch(() => {});
  }, []);

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
      if (d.mine) { setMine(d.mine); setMatch(d.match ?? null); setNote(""); }
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
        </header>

        {/* ----- daily good news ----- */}
        <section className="garden-block">
          <h2 className="garden-block-title font-type">TODAY&apos;S GOOD NEWS · 今日好消息</h2>

          {mine ? (
            <div className="garden-exchange">
              <div className="garden-card garden-card-mine">
                <p className="garden-card-tag font-type">
                  YOURS · {PILLAR_LABEL[mine.pillar].letter} {PILLAR_LABEL[mine.pillar].zh}
                </p>
                <p className="garden-card-text font-serif">“{mine.text}”</p>
              </div>
              {match ? (
                <div className="garden-card garden-card-match">
                  <p className="garden-card-tag font-type">
                    IN EXCHANGE · 来自另一位访客
                  </p>
                  <p className="garden-card-text font-serif">“{match.text}”</p>
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
        </section>

        {/* ----- five questions ----- */}
        <section className="garden-block">
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
