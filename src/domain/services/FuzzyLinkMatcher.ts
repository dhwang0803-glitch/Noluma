export interface FuzzyMatchResult {
  readonly target: string;
  readonly score: number;
}

const DEFAULT_THRESHOLD = 0.6;

export class FuzzyLinkMatcher {
  static findBestMatch(
    brokenTarget: string,
    vaultBasenames: ReadonlyArray<string>,
    threshold: number = DEFAULT_THRESHOLD,
  ): FuzzyMatchResult | null {
    const normalizedBroken = brokenTarget.toLowerCase().replace(/\.md$/i, '');
    let best: FuzzyMatchResult | null = null;

    for (const basename of vaultBasenames) {
      const normalizedCandidate = basename.toLowerCase().replace(/\.md$/i, '');

      if (normalizedBroken === normalizedCandidate) {
        return { target: basename, score: 1.0 };
      }

      const score = computeSimilarity(normalizedBroken, normalizedCandidate);
      if (score >= threshold && (!best || score > best.score)) {
        best = { target: basename, score };
      }
    }

    return best;
  }
}

function computeSimilarity(a: string, b: string): number {
  if (a.includes(b) || b.includes(a)) {
    const ratio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
    return ratio;
  }

  if (Math.abs(a.length - b.length) <= 2) {
    const dist = levenshteinDistance(a, b);
    if (dist <= 2) {
      const maxLen = Math.max(a.length, b.length);
      return 1 - dist / maxLen;
    }
  }

  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  const jaccard = computeJaccard(tokensA, tokensB);
  if (jaccard >= 0.5) return jaccard;

  return 0;
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }

  return dp[n];
}

function tokenize(str: string): ReadonlyArray<string> {
  return str.split(/[\s\-_.,]+/).filter(t => t.length >= 1);
}

function computeJaccard(tokensA: ReadonlyArray<string>, tokensB: ReadonlyArray<string>): number {
  if (tokensA.length === 0 && tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}
