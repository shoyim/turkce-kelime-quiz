"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Clock,
  Hash,
  Infinity as InfinityIcon,
  Keyboard,
  Languages,
  Layers,
  ListChecks,
  ListTodo,
  Play,
  Sparkles,
} from "lucide-react";
import { units, collectWords, totalWordCount } from "@/lib/vocab";
import type { Direction, QuizMode, QuizSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";

const COUNT_PRESETS = [10, 20, 30, 50];
const TIME_PRESETS = [0, 5, 10, 15, 20, 30];

const DIRECTIONS: { id: Direction; label: string; hint: string }[] = [
  { id: "tr2uz", label: "Türkçe → Özbekçe", hint: "Türkçe sorulur" },
  { id: "uz2tr", label: "Özbekçe → Türkçe", hint: "Özbekçe sorulur" },
  { id: "mixed", label: "Karışık", hint: "Her soru rastgele yön" },
];

export default function SetupScreen({
  onStart,
}: {
  onStart: (s: QuizSettings) => void;
}) {
  const [selectedUnits, setSelectedUnits] = useState<string[]>([units[0]?.id]);
  const [selectedCats, setSelectedCats] = useState<string[] | null>(null);
  const [count, setCount] = useState(20);
  const [seconds, setSeconds] = useState(15);
  const [direction, setDirection] = useState<Direction>("tr2uz");
  const [mode, setMode] = useState<QuizMode>("choice");

  // Seçilen ünitelerdeki mevcut kategoriler
  const availableCats = useMemo(() => {
    const map = new Map<string, { name: string; nameUz: string }>();
    for (const u of units) {
      if (!selectedUnits.includes(u.id)) continue;
      for (const c of u.categories)
        if (!map.has(c.key)) map.set(c.key, { name: c.name, nameUz: c.nameUz });
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
  }, [selectedUnits]);

  const poolSize = useMemo(
    () => collectWords(selectedUnits, selectedCats).length,
    [selectedUnits, selectedCats],
  );

  const effectiveCount = Math.min(count, poolSize);
  const canStart = selectedUnits.length > 0 && poolSize > 0;

  const a1 = units.filter((u) => u.level === "A1");
  const a2 = units.filter((u) => u.level === "A2");

  function toggleUnit(id: string) {
    setSelectedUnits((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      return next;
    });
    setSelectedCats(null); // üniteler değişince kategori filtresini sıfırla
  }

  function toggleCat(key: string) {
    setSelectedCats((prev) => {
      const base = prev ?? availableCats.map((c) => c.key);
      const next = base.includes(key)
        ? base.filter((x) => x !== key)
        : [...base, key];
      // hepsi seçiliyse null (= tümü) yap
      return next.length === availableCats.length ? null : next;
    });
  }

  const catIsOn = (key: string) =>
    selectedCats === null || selectedCats.includes(key);

  function selectLevel(level: "A1" | "A2" | "all") {
    if (level === "all") setSelectedUnits(units.map((u) => u.id));
    else setSelectedUnits(units.filter((u) => u.level === level).map((u) => u.id));
    setSelectedCats(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:pt-12">
      {/* Başlık */}
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
            <Sparkles className="h-3.5 w-3.5" />
            Türkçe–Özbekçe · {totalWordCount} kelime
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Kelime <span className="text-brand-600">Quiz</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Üniteyi seç, soru sayısını ve süreyi ayarla, teste başla.
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* 1 · Üniteler */}
      <Section
        icon={<Layers className="h-5 w-5" />}
        title="Üniteler"
        subtitle="Çalışmak istediğin bölümleri seç"
        action={
          <div className="flex gap-1.5">
            <Chip onClick={() => selectLevel("A1")}>A1</Chip>
            <Chip onClick={() => selectLevel("A2")}>A2</Chip>
            <Chip onClick={() => selectLevel("all")}>Tümü</Chip>
          </div>
        }
      >
        {[
          { label: "A1 Seviyesi", list: a1 },
          { label: "A2 Seviyesi", list: a2 },
        ].map((grp) => (
          <div key={grp.label} className="mb-4 last:mb-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {grp.label}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {grp.list.map((u) => {
                const on = selectedUnits.includes(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleUnit(u.id)}
                    className={cn(
                      "group relative flex flex-col rounded-xl border p-3 text-left transition",
                      on
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:bg-brand-900/20"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600",
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-bold">{u.title}</span>
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border text-white transition",
                          on
                            ? "border-brand-600 bg-brand-600"
                            : "border-slate-300 bg-transparent dark:border-slate-600",
                        )}
                      >
                        {on && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </span>
                    <span className="mt-0.5 text-xs text-slate-400">
                      {u.total} kelime
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Section>

      {/* 2 · Kategoriler */}
      {availableCats.length > 1 && (
        <Section
          icon={<BookOpen className="h-5 w-5" />}
          title="Kelime türü"
          subtitle="İstersen sadece belirli türleri çalış"
        >
          <div className="flex flex-wrap gap-2">
            {availableCats.map((c) => {
              const on = catIsOn(c.key);
              return (
                <button
                  key={c.key}
                  onClick={() => toggleCat(c.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                    on
                      ? "border-brand-500 bg-brand-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                  )}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                  {c.name}
                  <span className="opacity-60">· {c.nameUz}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* 3 · Cevap şekli */}
      <Section
        icon={<ListTodo className="h-5 w-5" />}
        title="Cevap şekli"
        subtitle="Nasıl cevap vermek istersin?"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => setMode("choice")}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition",
              mode === "choice"
                ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:bg-brand-900/20"
                : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900",
            )}
          >
            <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <span>
              <span className="block text-sm font-bold">Çoktan seçmeli</span>
              <span className="text-xs text-slate-400">
                4 şıktan doğru olanı işaretle
              </span>
            </span>
          </button>
          <button
            onClick={() => setMode("writing")}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition",
              mode === "writing"
                ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:bg-brand-900/20"
                : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900",
            )}
          >
            <Keyboard className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <span>
              <span className="block text-sm font-bold">Yazarak</span>
              <span className="text-xs text-slate-400">
                Cevabı klavyeden yaz · hatalar düzeltilir
              </span>
            </span>
          </button>
        </div>
      </Section>

      {/* 4 · Soru sayısı */}
      <Section
        icon={<Hash className="h-5 w-5" />}
        title="Soru sayısı"
        subtitle={`Havuzda ${poolSize} kelime var · rastgele seçilir`}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {COUNT_PRESETS.map((n) => (
            <Preset
              key={n}
              active={count === n}
              disabled={n > poolSize}
              onClick={() => setCount(n)}
            >
              {n}
            </Preset>
          ))}
          <Preset
            active={count >= poolSize && poolSize > 0}
            onClick={() => setCount(poolSize)}
          >
            Tümü ({poolSize})
          </Preset>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={Math.max(poolSize, 1)}
            value={effectiveCount}
            onChange={(e) => setCount(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600 dark:bg-slate-700"
          />
          <span className="w-16 shrink-0 text-right text-2xl font-black tabular-nums text-brand-600">
            {effectiveCount}
          </span>
        </div>
      </Section>

      {/* 5 · Süre */}
      <Section
        icon={<Clock className="h-5 w-5" />}
        title="Soru başına süre"
        subtitle="Süre bitince otomatik sonraki soruya geçer"
      >
        <div className="flex flex-wrap gap-2">
          {TIME_PRESETS.map((t) => (
            <Preset key={t} active={seconds === t} onClick={() => setSeconds(t)}>
              {t === 0 ? (
                <span className="inline-flex items-center gap-1">
                  <InfinityIcon className="h-4 w-4" /> Süresiz
                </span>
              ) : (
                `${t} sn`
              )}
            </Preset>
          ))}
        </div>
      </Section>

      {/* 6 · Yön */}
      <Section
        icon={<Languages className="h-5 w-5" />}
        title="Soru yönü"
        subtitle="Hangi dilde soru sorulsun?"
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {DIRECTIONS.map((d) => {
            const on = direction === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setDirection(d.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  on
                    ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:bg-brand-900/20"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900",
                )}
              >
                <span className="block text-sm font-bold">{d.label}</span>
                <span className="text-xs text-slate-400">{d.hint}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Başlat (sabit alt bar) */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <ListChecks className="h-4 w-4 text-brand-600" />
            <span>
              <b className="text-slate-800 dark:text-slate-100">
                {effectiveCount}
              </b>{" "}
              soru ·{" "}
              {seconds === 0 ? "süresiz" : `${seconds} sn`}
            </span>
          </div>
          <button
            disabled={!canStart}
            onClick={() =>
              onStart({
                unitIds: selectedUnits,
                categoryKeys: selectedCats,
                count: effectiveCount,
                seconds,
                direction,
                mode,
              })
            }
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play className="h-5 w-5" />
            Teste Başla
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
            {icon}
          </span>
          <div>
            <h2 className="font-bold leading-tight">{title}</h2>
            {subtitle && (
              <p className="text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Preset({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-brand-500 bg-brand-600 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
        disabled && "cursor-not-allowed opacity-30",
      )}
    >
      {children}
    </button>
  );
}

function Chip({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
    >
      {children}
    </button>
  );
}
