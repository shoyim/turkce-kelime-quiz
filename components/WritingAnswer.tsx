"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Pencil, X } from "lucide-react";
import type { Answered, Question } from "@/lib/types";
import { checkAnswer, diffAnswer, type DiffChar } from "@/lib/match";
import { cn } from "@/lib/utils";

export interface WriteResult {
  selected: string;
  correct: boolean;
  close: boolean;
}

export default function WritingAnswer({
  question,
  answered,
  onSubmit,
  onAdvance,
}: {
  question: Question;
  answered: Answered | null;
  onSubmit: (r: WriteResult) => void;
  onAdvance: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const advanceBtnRef = useRef<HTMLButtonElement>(null);

  // Her yeni soruda alanı sıfırla ve odakla
  useEffect(() => {
    setValue("");
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [question.index]);

  // Cevaplandığında "Devam" butonuna odaklan (Enter ile geçiş)
  useEffect(() => {
    if (answered) advanceBtnRef.current?.focus();
  }, [answered]);

  function submit() {
    if (answered) return;
    const res = checkAnswer(value, question.answer);
    onSubmit({
      selected: value,
      correct: res.status !== "wrong",
      close: res.status === "close",
    });
  }

  // ---- Cevaplanmadıysa: giriş alanı ----
  if (!answered) {
    return (
      <div className="animate-fade-in">
        <div className="relative">
          <Pencil className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={
              question.direction === "tr2uz"
                ? "Özbekçesini yaz…"
                : "Türkçesini yaz…"
            }
            className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-lg font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <button
          onClick={submit}
          disabled={value.trim().length === 0}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="h-5 w-5" /> Kontrol Et
          <kbd className="ml-1 rounded bg-white/20 px-1.5 text-xs font-medium">
            Enter
          </kbd>
        </button>
      </div>
    );
  }

  // ---- Cevaplandıysa: geri bildirim + düzeltme ----
  const res = checkAnswer(answered.selected ?? "", question.answer);
  const diff =
    answered.selected && answered.selected.trim().length > 0
      ? diffAnswer(answered.selected, res.best)
      : null;

  const tone = answered.correct
    ? answered.close
      ? "amber"
      : "emerald"
    : "brand";

  const heading = answered.timedOut
    ? "Süre doldu"
    : answered.correct
      ? answered.close
        ? "Neredeyse doğru!"
        : "Doğru! 🎉"
      : "Yanlış";

  return (
    <div className="animate-fade-in space-y-3">
      <div
        className={cn(
          "rounded-xl border p-4",
          tone === "emerald" &&
            "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20",
          tone === "amber" &&
            "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20",
          tone === "brand" &&
            "border-brand-300 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20",
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-white",
              tone === "emerald" && "bg-emerald-500",
              tone === "amber" && "bg-amber-500",
              tone === "brand" && "bg-brand-600",
            )}
          >
            {answered.correct ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </span>
          <span
            className={cn(
              "font-bold",
              tone === "emerald" && "text-emerald-700 dark:text-emerald-300",
              tone === "amber" && "text-amber-700 dark:text-amber-300",
              tone === "brand" && "text-brand-700 dark:text-brand-300",
            )}
          >
            {heading}
          </span>
        </div>

        {/* Doğru yazım — eksik/yanlış harfler vurgulu */}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Doğru cevap:
        </p>
        <p className="text-2xl font-black tracking-tight">
          {diff && !answered.correct ? (
            <DiffText chars={diff.answer} side="answer" />
          ) : diff && answered.close ? (
            <DiffText chars={diff.answer} side="answer" />
          ) : (
            res.best
          )}
        </p>

        {/* Kullanıcının yazdığı — fark varsa göster */}
        {diff && !(answered.correct && !answered.close) && (
          <p className="mt-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              Senin cevabın:{" "}
            </span>
            <span className="font-semibold">
              <DiffText chars={diff.typed} side="typed" />
            </span>
          </p>
        )}
      </div>

      <button
        ref={advanceBtnRef}
        onClick={onAdvance}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 font-bold text-slate-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
      >
        Devam <ArrowRight className="h-5 w-5" />
        <kbd className="ml-1 rounded bg-slate-100 px-1.5 text-xs font-medium dark:bg-slate-800">
          Enter
        </kbd>
      </button>
    </div>
  );
}

function DiffText({
  chars,
  side,
}: {
  chars: DiffChar[];
  side: "answer" | "typed";
}) {
  return (
    <>
      {chars.map((c, i) => {
        if (c.state === "ok")
          return <span key={i}>{c.ch === " " ? " " : c.ch}</span>;
        if (c.state === "missing")
          // doğru cevapta olup kullanıcının yazmadığı harf
          return (
            <span
              key={i}
              className="rounded bg-brand-200 text-brand-800 underline decoration-2 dark:bg-brand-700/60 dark:text-brand-100"
            >
              {c.ch === " " ? " " : c.ch}
            </span>
          );
        if (c.state === "extra")
          // fazladan yazılan harf
          return (
            <span key={i} className="text-slate-400 line-through">
              {c.ch === " " ? " " : c.ch}
            </span>
          );
        // bad — yanlış harf
        return (
          <span
            key={i}
            className={cn(
              "rounded underline decoration-2",
              side === "answer"
                ? "bg-brand-200 text-brand-800 dark:bg-brand-700/60 dark:text-brand-100"
                : "text-brand-600 line-through",
            )}
          >
            {c.ch === " " ? " " : c.ch}
          </span>
        );
      })}
    </>
  );
}
