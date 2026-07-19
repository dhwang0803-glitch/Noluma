import { TfIdfCorpus } from './TfIdfCorpus';

export interface LinkCandidate {
  readonly path: string;
  readonly tags: ReadonlyArray<string>;
  readonly tokens: ReadonlyArray<string>;
}

export interface LinkSuggestion {
  readonly path: string;
  readonly score: number;
  readonly reason: string;
}

const TAG_WEIGHT = 0.3;
const TFIDF_WEIGHT = 0.5;
const FILENAME_WEIGHT = 0.2;
const MIN_SCORE = 0.1;
const DEFAULT_MAX_LINKS = 5;

export class LinkSuggestionService {
  static findRelatedNotes(params: {
    orphanPath: string;
    orphanTags: ReadonlyArray<string>;
    orphanTokens: ReadonlyArray<string>;
    candidates: ReadonlyArray<LinkCandidate>;
    corpus: TfIdfCorpus;
    maxLinks?: number;
  }): ReadonlyArray<LinkSuggestion> {
    const { orphanPath, orphanTags, orphanTokens, candidates, corpus, maxLinks = DEFAULT_MAX_LINKS } = params;
    const orphanBasename = extractBasename(orphanPath);
    const orphanNameTokens = tokenizeFilename(orphanBasename);
    const orphanVec = corpus.computeTfIdfVector(orphanTokens as string[]);

    const scored: LinkSuggestion[] = [];

    for (const candidate of candidates) {
      if (candidate.path === orphanPath) continue;

      const tagScore = computeTagOverlap(orphanTags, candidate.tags);
      const candidateVec = corpus.computeTfIdfVector(candidate.tokens as string[]);
      const tfidfScore = corpus.cosineSimilarity(orphanVec, candidateVec);
      const filenameScore = computeFilenameOverlap(orphanNameTokens, tokenizeFilename(extractBasename(candidate.path)));

      const combined = tagScore * TAG_WEIGHT + tfidfScore * TFIDF_WEIGHT + filenameScore * FILENAME_WEIGHT;
      if (combined < MIN_SCORE) continue;

      const reasons: string[] = [];
      if (tagScore > 0) reasons.push(`tag overlap ${Math.round(tagScore * 100)}%`);
      if (tfidfScore > 0.05) reasons.push(`content similarity ${Math.round(tfidfScore * 100)}%`);
      if (filenameScore > 0) reasons.push(`filename match ${Math.round(filenameScore * 100)}%`);

      scored.push({
        path: candidate.path,
        score: combined,
        reason: reasons.join(', '),
      });
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxLinks);
  }
}

function computeTagOverlap(tagsA: ReadonlyArray<string>, tagsB: ReadonlyArray<string>): number {
  if (tagsA.length === 0 || tagsB.length === 0) return 0;
  const setB = new Set(tagsB.map(t => t.toLowerCase()));
  let overlap = 0;
  for (const tag of tagsA) {
    if (setB.has(tag.toLowerCase())) overlap++;
  }
  const union = new Set([...tagsA.map(t => t.toLowerCase()), ...setB]).size;
  return union > 0 ? overlap / union : 0;
}

function computeFilenameOverlap(tokensA: ReadonlyArray<string>, tokensB: ReadonlyArray<string>): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setB = new Set(tokensB);
  let overlap = 0;
  for (const token of tokensA) {
    if (setB.has(token)) overlap++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? overlap / union : 0;
}

function extractBasename(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  const name = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
  return name.replace(/\.md$/i, '');
}

function tokenizeFilename(name: string): ReadonlyArray<string> {
  return name
    .toLowerCase()
    .split(/[\s\-_.,]+/)
    .filter(t => t.length >= 2);
}
