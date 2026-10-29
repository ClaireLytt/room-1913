"use client";
import { useEffect, useRef, useState } from "react";

// Breathing window — a three-minute 4-7-8 exercise. The room dims to the
// rain and a single ring of lamplight that swells and settles.

type Phase = "inhale" | "hold" | "exhale";
const PHASES: { phase: Phase; seconds: number; zh: string }[] = [
  { phase: "inhale", seconds: 4, zh: "吸气" },
  { phase: "hold",   seconds: 7, zh: "屏息" },
  { phase: "exhale", seconds: 8, zh: "呼气" },
];
const CYCLES = 9; // ~3 minutes

export default function Breathing({ onFinish }: { onFinish: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0); // index into cycles*phases
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setOpen(false);
    setStep(0);
    setDone(false);
    window.dispatchEvent(new CustomEvent("room1913:hush", { detail: { mul: 1, ms: 1400 } }));
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const start = () => {
    setOpen(true);
    setDone(false);
    setStep(0);
    window.dispatchEvent(new CustomEvent("room1913:hush", { detail: { mul: 0.3, ms: 900 } }));
    const total = CYCLES * PHASES.length;
    const run = (i: number) => {
      if (i >= total) { setDone(true); return; }
      setStep(i);
      timer.current = setTimeout(() => run(i + 1), PHASES[i % PHASES.length].seconds * 1000);
    };
    run(0);
  };

  const cur = PHASES[step % PHASES.length];
  const cycle = Math.floor(step / PHASES.length) + 1;

  return (
    <>
      <button className="garden-btn font-type" onClick={start}>
        BEGIN · 跟着灯呼吸三分钟
      </button>

      {open && (
        <div className="breath-veil" role="dialog" aria-label="breathing exercise">
          {!done ? (
            <>
              <div className={`breath-ring breath-${cur.phase}`} />
              <p className="breath-phase font-serif">{cur.zh}</p>
              <p className="breath-count font-type">{cycle} / {CYCLES}</p>
              <button className="breath-exit font-type" onClick={stop}>离开</button>
            </>
          ) : (
            <div className="breath-done">
              <p className="breath-phase font-serif">现在，感觉如何？</p>
              <p className="garden-hint font-serif ink-fade">
                如果有什么细小的好事浮上来，把它放进花园。
              </p>
              <div className="breath-done-actions">
                <button
                  className="garden-btn font-type"
                  onClick={() => { stop(); onFinish(); }}
                >
                  写一条好消息
                </button>
                <button className="breath-exit font-type" onClick={stop}>就这样，很好</button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
