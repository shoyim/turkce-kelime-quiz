"use client";

import { useEffect, useMemo } from "react";
import {
  Check,
  Home,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
import type { Answered, Question } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ResultScreen({
  questions,
  answers,
  onRetry,
  onNew,
}: {
  questions: Question[];
  answers: Answered[];
  onRetry: () => void;
  onNew: () => void;
}) {
  const stats = useMemo(() => {
    const correct = answers.filter((a) => a.correct).length;
    const timedOut = answers.filter((a) => a.timedOut && !a.correct).length;
    const wrong = answers.length - correct - timedOut;
    const pct = Math.round((correct / Math.max(answers.length, 1)) * 100);
    return { correct, wrong, timedOut, pct, total: answers.length };
  }, [answers]);

  // En iyi skoru sakla
  useEffect(() => {
    try {
      const prev = Number(localStorage.getItem("tkq-best") ?? 0);
      if (stats.pct > prev) localStorage.setItem("tkq-best", String(stats.pct));
    } catch {
      /* ignore */
    }
  }, [stats.pct]);

  const grade =
    stats.pct >= 90
      ? { label: "Mükemmel!", color: "text-emerald-500" }
      : stats.pct >= 70
        ? { label: "Çok iyi!", color: "text-emerald-500" }
        : stats.pct >= 50
          ? { label: "Fena değil", color: "text-amber-500" }
          : { label: "Biraz daha çalış", color: "text-brand-600" };

  const r = 52;
  const circ = 2 * Math.PI * r;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-8">
      {/* Skor kartı */}
      <div className="animate-pop-in rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className={cn("text-2xl font-black", grade.color)}>{grade.label}</h1>
        <p className="mt-1 text-sm text-slate-400">Test tamamlandı</p>

        {/* Yüzde halkası */}
        <div className="relative mx-auto my-6 h-36 w-36">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={r} strokeWidth="10" className="fill-none stroke-slate-200 dark:stroke-slate-800" />
            <circle
              cx="60"
              cy="60"
              r={r}
              strokeWidth="10"
              strokeLinecap="round"
              className="fill-none stroke-brand-600 transition-[stroke-dashoffset] duration-1000"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - stats.pct / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black tabular-nums">{stats.pct}%</span>
            <span className="text-xs text-slate-400">
              {stats.correct}/{stats.total} doğru
            </span>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-3">
          <Stat value={stats.correct} label="Doğru" tone="emerald" />
          <Stat value={stats.wrong} label="Yanlış" tone="brand" />
          <Stat value={stats.timedOut} label="Süre doldu" tone="slate" />
        </div>

        {/* Aksiyonlar */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onRetry}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
          >
            <RotateCcw className="h-5 w-5" /> Tekrar Çöz
          </button>
          <button
            onClick={onNew}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 font-bold text-slate-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
          >
            <Home className="h-5 w-5" /> Yeni Test
          </button>
        </div>
      </div>

      {/* İnceleme listesi */}
      <h2 className="mb-3 mt-8 px-1 text-sm font-bold uppercase tracking-wide text-slate-400">
        Cevaplarını incele
      </h2>
      <ul className="space-y-2">
        {questions.map((q, i) => {
          const a = answers[i];
          const ok = a.correct;
          return (
            <li
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4",
                ok
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-900/10"
                  : "border-brand-200 bg-brand-50/40 dark:border-brand-900/50 dark:bg-brand-900/10",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
                  ok ? "bg-emerald-500" : "bg-brand-600",
                )}
              >
                {ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {q.prompt}{" "}
                  <span className="font-medium text-slate-400">
                    → {q.answer}
                  </span>
                </p>
                {!ok && (
                  <p className="mt-0.5 text-sm text-brand-600">
                    {a.timedOut
                      ? "Süre doldu (cevapsız)"
                      : `Senin cevabın: ${a.selected}`}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "emerald" | "brand" | "slate";
}) {
  const tones = {
    emerald: "text-emerald-500",
    brand: "text-brand-600",
    slate: "text-slate-400",
  };
  return (
    <div className="rounded-xl bg-slate-50 py-3 dark:bg-slate-800/50">
      <div className={cn("text-2xl font-black tabular-nums", tones[tone])}>
        {value}
      </div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
