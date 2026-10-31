import rawData from "@/data/vocab.json";
import type {
  VocabData,
  Unit,
  Word,
  QuizSettings,
  Question,
} from "./types";

export const vocab = rawData as unknown as VocabData;

export const units: Unit[] = vocab.units;

export function getUnit(id: string): Unit | undefined {
  return units.find((u) => u.id === id);
}

export const totalWordCount = units.reduce((s, u) => s + u.total, 0);

/** Fisher–Yates shuffle (saf — girişi değiştirmez). */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Seçilen ünite/kategorilere göre kelime havuzunu toplar. */
export function collectWords(
  unitIds: string[],
  categoryKeys: string[] | null,
): Word[] {
  const pool: Word[] = [];
  for (const id of unitIds) {
    const u = getUnit(id);
    if (!u) continue;
    for (const c of u.categories) {
      if (categoryKeys && !categoryKeys.includes(c.key)) continue;
      pool.push(...c.words);
    }
  }
  // Aynı kelimeleri (tr+uz) tekilleştir
  const seen = new Set<string>();
  return pool.filter((w) => {
    const k = `${w.tr.toLowerCase()}|${w.uz.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function pickDistractors(
  pool: Word[],
  correct: Word,
  dir: "tr2uz" | "uz2tr",
  n: number,
): string[] {
  const answerOf = (w: Word) => (dir === "tr2uz" ? w.uz : w.tr);
  const correctAns = answerOf(correct);
  const seen = new Set<string>([correctAns.toLowerCase()]);
  const out: string[] = [];
  for (const w of shuffle(pool)) {
    const a = answerOf(w);
    const key = a.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
    if (out.length >= n) break;
  }
  return out;
}

/** Ayarlardan tam bir test (sorular dizisi) üretir. */
export function buildQuiz(settings: QuizSettings): Question[] {
  const pool = collectWords(settings.unitIds, settings.categoryKeys);
  const chosen = shuffle(pool).slice(0, Math.min(settings.count, pool.length));

  // Şıklar için tüm havuzu distractor kaynağı olarak kullan
  const distractorPool = pool.length >= 8 ? pool : collectWordsFallback();

  return chosen.map((word, i) => {
    const dir: "tr2uz" | "uz2tr" =
      settings.direction === "mixed"
        ? Math.random() < 0.5
          ? "tr2uz"
          : "uz2tr"
        : settings.direction;

    const prompt = dir === "tr2uz" ? word.tr : word.uz;
    const answer = dir === "tr2uz" ? word.uz : word.tr;
    const distractors = pickDistractors(distractorPool, word, dir, 3);
    const options = shuffle([answer, ...distractors]);

    return {
      index: i,
      prompt,
      answer,
      options,
      direction: dir,
      source: word,
    } satisfies Question;
  });
}

/** Havuz çok küçükse şıkları zenginleştirmek için tüm kelimeler. */
function collectWordsFallback(): Word[] {
  const all: Word[] = [];
  for (const u of units) for (const c of u.categories) all.push(...c.words);
  return all;
}
