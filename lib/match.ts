/**
 * Yazarak cevap modu için eşleştirme ve düzeltme yardımcıları.
 *
 * - Kullanıcının yazdığı metin, doğru cevapla karşılaştırılır.
 * - Küçük yazım hataları / eksik harfler tolere edilir ("neredeyse doğru").
 * - Harf harf hizalama ile doğru yazım gösterilip eksik/yanlış harfler
 *   vurgulanır.
 */

/** Tek karakteri karşılaştırma için sadeleştirir (ç→c, ğ→g, ı→i, ö→o ...). */
export function foldChar(ch: string): string {
  let f = ch
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, ""); // birleşik aksan işaretlerini kaldır
  if (f === "ı") f = "i";
  if ("’`ʻ´'".includes(f)) f = "'";
  return f || ch.toLowerCase();
}

export function fold(s: string): string {
  return Array.from(s.trim().replace(/\s+/g, " "))
    .map(foldChar)
    .join("");
}

/** Doğru cevaptan kabul edilebilir varyantlar üretir. */
export function acceptVariants(answer: string): string[] {
  const out = new Set<string>();
  const add = (x: string) => {
    const t = x.trim().replace(/\s+/g, " ");
    if (t) out.add(t);
  };
  add(answer);
  // virgül / eğik çizgi / noktalı virgül ile ayrılmış seçenekler
  for (const part of answer.split(/[,/;]|\bveya\b|\byoki\b/i)) {
    add(part);
    add(part.replace(/\(.*?\)/g, "")); // parantez içi notları at
  }
  add(answer.replace(/\(.*?\)/g, ""));
  return Array.from(out);
}

/** Levenshtein mesafesi (düzenleme mesafesi). */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let cur = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

export type MatchStatus = "correct" | "close" | "wrong";

export interface MatchResult {
  status: MatchStatus;
  /** Kullanıcıya gösterilecek doğru yazım (en iyi eşleşen varyant). */
  best: string;
  distance: number;
}

/** Kullanıcının cevabını doğru cevapla karşılaştırır. */
export function checkAnswer(user: string, answer: string): MatchResult {
  const variants = acceptVariants(answer);
  const uf = fold(user);

  let best = variants[0] ?? answer;
  let bestDist = Infinity;
  for (const v of variants) {
    const d = levenshtein(uf, fold(v));
    if (d < bestDist) {
      bestDist = d;
      best = v;
    }
  }

  if (uf.length === 0) return { status: "wrong", best, distance: bestDist };
  if (bestDist === 0) return { status: "correct", best, distance: 0 };

  const thr = Math.max(1, Math.floor(fold(best).length * 0.34));
  return {
    status: bestDist <= thr ? "close" : "wrong",
    best,
    distance: bestDist,
  };
}

export type CharState = "ok" | "bad" | "missing" | "extra";
export interface DiffChar {
  ch: string;
  state: CharState;
}

/**
 * Kullanıcının yazdığı ile doğru cevabı harf harf hizalar.
 * Döndürür:
 *  - answer: doğru cevap; eksik/yanlış harfler işaretli
 *  - typed:  kullanıcının yazdığı; yanlış/fazla harfler işaretli
 */
export function diffAnswer(
  user: string,
  answer: string,
): { answer: DiffChar[]; typed: DiffChar[] } {
  const a = Array.from(user.trim().replace(/\s+/g, " "));
  const b = Array.from(answer.trim().replace(/\s+/g, " "));
  const af = a.map(foldChar);
  const bf = b.map(foldChar);
  const m = a.length;
  const n = b.length;

  // DP tablosu (hizalama için)
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = af[i - 1] === bf[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  // Geri izleme
  const answerOut: DiffChar[] = [];
  const typedOut: DiffChar[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    const cost = i > 0 && j > 0 && af[i - 1] === bf[j - 1] ? 0 : 1;
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + cost) {
      if (cost === 0) {
        answerOut.push({ ch: b[j - 1], state: "ok" });
        typedOut.push({ ch: a[i - 1], state: "ok" });
      } else {
        answerOut.push({ ch: b[j - 1], state: "bad" }); // yanlış yazılmış harf
        typedOut.push({ ch: a[i - 1], state: "bad" });
      }
      i--;
      j--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      answerOut.push({ ch: b[j - 1], state: "missing" }); // eksik harf
      j--;
    } else {
      typedOut.push({ ch: a[i - 1], state: "extra" }); // fazladan harf
      i--;
    }
  }
  answerOut.reverse();
  typedOut.reverse();
  return { answer: answerOut, typed: typedOut };
}
