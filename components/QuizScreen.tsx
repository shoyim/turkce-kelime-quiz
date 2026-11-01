"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Flag,
  TimerOff,
  X,
} from "lucide-react";
import type { Answered, Question, QuizMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import WritingAnswer, { type WriteResult } from "./WritingAnswer";

const OPTION_KEYS = ["A", "B", "C", "D"];
const ADVANCE_DELAY = 850; // ms — çoktan seçmelide otomatik geçiş
const WRITE_OK_DELAY = 1200; // yazarak: doğru cevaptan sonra
const WRITE_FIX_DELAY = 2600; // yazarak: yanlış/eksikte okumak için daha uzun

export default function QuizScreen({
  questions,
  seconds,
  mode,
  onFinish,
  onExit,
}: {
  questions: Question[];
  seconds: number; // 0 = süresiz
  mode: QuizMode;
  onFinish: (answers: Answered[]) => void;
  onExit: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(Answered | null)[]>(() =>
    Array(questions.length).fill(null),
  );
  const [timeLeft, setTimeLeft] = useState(seconds);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = questions[current];
  const answered = answers[current];
  const isLast = current === questions.length - 1;
  const answeredCount = answers.filter(Boolean).length;

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= questions.length) return;
      if (advanceRef.current) clearTimeout(advanceRef.current);
      setCurrent(idx);
    },
    [questions.length],
  );

  const finish = useCallback(() => {
    if (advanceRef.current) clearTimeout(advanceRef.current);
    onFinish(answers.map((a) => a ?? { selected: null, correct: false, timedOut: true }));
  }, [answers, onFinish]);

  const advance = useCallback(() => {
    if (isLast) finish();
    else goTo(current + 1);
  }, [current, isLast, finish, goTo]);

  const commit = useCallback(
    (ans: Answered, delay = ADVANCE_DELAY) => {
      setAnswers((prev) => {
        if (prev[current]) return prev; // zaten cevaplı
        const next = [...prev];
        next[current] = ans;
        return next;
      });
      if (advanceRef.current) clearTimeout(advanceRef.current);
      advanceRef.current = setTimeout(advance, delay);
    },
    [current, advance],
  );

  // Çoktan seçmeli: şık seç
  const pickOption = useCallback(
    (opt: string) =>
      commit({ selected: opt, correct: opt === q.answer, timedOut: false }),
    [commit, q],
  );

  // Yazarak: cevabı değerlendir
  const submitWriting = useCallback(
    (r: WriteResult) =>
      commit(
        { selected: r.selected, correct: r.correct, timedOut: false, close: r.close },
        r.correct && !r.close ? WRITE_OK_DELAY : WRITE_FIX_DELAY,
      ),
    [commit],
  );

  // Süre sayacı — sadece cevaplanmamış soruda ve süre açıksa çalışır
  useEffect(() => {
    if (seconds === 0 || answered) return;
    setTimeLeft(seconds);
    const start = Date.now();
    const id = setInterval(() => {
      const left = seconds - Math.floor((Date.now() - start) / 1000);
      if (left <= 0) {
        clearInterval(id);
        setTimeLeft(0);
        // süre doldu → cevapsız işaretle, doğruyu göster, geç
        commit(
          { selected: null, correct: false, timedOut: true },
          mode === "writing" ? WRITE_FIX_DELAY : ADVANCE_DELAY,
        );
      } else {
        setTimeLeft(left);
      }
    }, 200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, seconds, answered]);

  // Klavye: ok tuşları gezinme · çoktan seçmelide 1–4 / A–D şık seç
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return; // yazarken karışma
      if (e.key === "ArrowRight") goTo(current + 1);
      else if (e.key === "ArrowLeft") goTo(current - 1);
      else if (mode === "choice" && !answered) {
        const idx = "1234".indexOf(e.key);
        const letter = ["a", "b", "c", "d"].indexOf(e.key.toLowerCase());
        const pick = idx >= 0 ? idx : letter;
        if (pick >= 0 && pick < q.options.length) pickOption(q.options[pick]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, answered, q, pickOption, goTo, mode]);

  useEffect(() => {
    return () => {
      if (advanceRef.current) clearTimeout(advanceRef.current);
    };
  }, []);

  const pct = ((current + (answered ? 1 : 0)) / questions.length) * 100;
  const timePct = seconds > 0 ? (timeLeft / seconds) * 100 : 100;
  const timeLow = seconds > 0 && timeLeft <= 5 && !answered;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-8 pt-5">
      {/* ÜST GEZİNME ÇUBUĞU */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600"
          >
            <ChevronLeft className="h-4 w-4" /> Çıkış
          </button>

          <div className="flex items-center gap-2">
            <NavBtn
              label="Önceki soru"
              disabled={current === 0}
              onClick={() => goTo(current - 1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </NavBtn>
            <span className="min-w-[72px] text-center text-sm font-bold tabular-nums">
              {current + 1}{" "}
              <span className="text-slate-400">/ {questions.length}</span>
            </span>
            <NavBtn
              label="Sonraki soru"
              disabled={current === questions.length - 1}
              onClick={() => goTo(current + 1)}
            >
              <ArrowRight className="h-5 w-5" />
            </NavBtn>
          </div>

          {/* Süre halkası */}
          {seconds > 0 ? (
            <div
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-full text-sm font-black tabular-nums transition-colors",
                timeLow
                  ? "text-brand-600 animate-pulse"
                  : "text-slate-700 dark:text-slate-200",
              )}
            >
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="19" strokeWidth="4" className="fill-none stroke-slate-200 dark:stroke-slate-700" />
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className={cn("fill-none transition-[stroke-dashoffset] duration-200", timeLow ? "stroke-brand-600" : "stroke-brand-500")}
                  strokeDasharray={2 * Math.PI * 19}
                  strokeDashoffset={2 * Math.PI * 19 * (1 - timePct / 100)}
                />
              </svg>
              {answered ? <span className="text-slate-300">·</span> : timeLeft}
            </div>
          ) : (
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-300" title="Süresiz">
              <TimerOff className="h-5 w-5" />
            </span>
          )}
        </div>

        {/* İlerleme çubuğu */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* SORU KARTI */}
      <div key={current} className="flex flex-1 flex-col animate-fade-in">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-600">
            {q.direction === "tr2uz" ? "Bu kelimenin Özbekçesi?" : "Bu kelimenin Türkçesi?"}
          </p>
          <h2 className="break-words text-3xl font-black leading-tight sm:text-4xl">
            {q.prompt}
          </h2>
        </div>

        {/* CEVAP ALANI */}
        {mode === "writing" ? (
          <WritingAnswer
            question={q}
            answered={answered}
            onSubmit={submitWriting}
            onAdvance={advance}
          />
        ) : (
        <div className="grid gap-3">
          {q.options.map((opt, i) => {
            const isSelected = answered?.selected === opt;
            const isCorrect = opt === q.answer;
            const reveal = Boolean(answered);

            let state: "idle" | "correct" | "wrong" | "muted" = "idle";
            if (reveal) {
              if (isCorrect) state = "correct";
              else if (isSelected) state = "wrong";
              else state = "muted";
            }

            return (
              <button
                key={opt + i}
                disabled={reveal}
                onClick={() => pickOption(opt)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border p-4 text-left transition",
                  state === "idle" &&
                    "border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-500/60",
                  state === "correct" &&
                    "border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/25",
                  state === "wrong" &&
                    "border-brand-500 bg-brand-50 animate-shake dark:border-brand-500 dark:bg-brand-900/25",
                  state === "muted" && "border-slate-200 bg-white opacity-50 dark:border-slate-800 dark:bg-slate-900",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black transition",
                    state === "idle" &&
                      "bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-700 dark:bg-slate-800 dark:text-slate-400",
                    state === "correct" && "bg-emerald-500 text-white",
                    state === "wrong" && "bg-brand-600 text-white",
                    state === "muted" && "bg-slate-100 text-slate-400 dark:bg-slate-800",
                  )}
                >
                  {state === "correct" ? (
                    <Check className="h-5 w-5" />
                  ) : state === "wrong" ? (
                    <X className="h-5 w-5" />
                  ) : (
                    OPTION_KEYS[i]
                  )}
                </span>
                <span className="flex-1 font-semibold">{opt}</span>
              </button>
            );
          })}
        </div>
        )}

        {/* Zamanında cevaplanmadı bilgisi (çoktan seçmeli) */}
        {mode === "choice" && answered?.timedOut && (
          <p className="mt-4 text-center text-sm font-medium text-brand-600">
            Süre doldu — doğru cevap yukarıda işaretli.
          </p>
        )}

        <div className="flex-1" />

        {/* Bitir butonu */}
        <button
          onClick={finish}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400"
        >
          <Flag className="h-4 w-4" />
          Testi Bitir ({answeredCount}/{questions.length} cevaplandı)
        </button>
      </div>
    </div>
  );
}

function NavBtn({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    >
      {children}
    </button>
  );
}
