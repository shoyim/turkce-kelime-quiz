export interface Word {
  tr: string; // Türkçe
  uz: string; // Özbekçe (Oʻzbekcha)
}

export interface Category {
  key: string;
  name: string; // Türkçe kategori adı (İsimler, Fiiller ...)
  nameUz: string; // Oʻzbekcha nomi
  words: Word[];
}

export interface Unit {
  id: string;
  file: string;
  level: "A1" | "A2";
  number: number;
  title: string; // "Ünite 3"
  subtitle: string; // "A1" | "A2"
  categories: Category[];
  total: number;
}

export interface VocabData {
  units: Unit[];
}

export type Direction = "tr2uz" | "uz2tr" | "mixed";
export type QuizMode = "choice" | "writing";

export interface QuizSettings {
  unitIds: string[];
  categoryKeys: string[] | null; // null = all categories in the units
  count: number; // kaç soru
  seconds: number; // 0 = süresiz
  direction: Direction;
  mode: QuizMode; // çoktan seçmeli / yazarak
}

export interface Question {
  index: number;
  prompt: string; // gösterilen kelime
  answer: string; // doğru cevap
  options: string[]; // 4 şık (karışık)
  direction: "tr2uz" | "uz2tr";
  source: Word;
}

export interface Answered {
  selected: string | null; // seçilen şık / yazılan metin · null = cevapsız
  correct: boolean;
  timedOut: boolean;
  close?: boolean; // yazarak modunda küçük hatayla doğru
}
