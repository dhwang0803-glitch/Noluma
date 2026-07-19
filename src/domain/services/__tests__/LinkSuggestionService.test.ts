import { describe, it, expect } from 'vitest';
import { LinkSuggestionService } from '../LinkSuggestionService';
import { TfIdfCorpus } from '../TfIdfCorpus';

describe('LinkSuggestionService', () => {
  function buildCorpus(docs: Record<string, string[]>): TfIdfCorpus {
    const corpus = new TfIdfCorpus();
    for (const [id, tokens] of Object.entries(docs)) {
      corpus.addDocument(id, tokens);
    }
    return corpus;
  }

  it('returns empty if no candidates match', () => {
    const corpus = buildCorpus({ 'orphan.md': ['apple', 'banana'] });
    const result = LinkSuggestionService.findRelatedNotes({
      orphanPath: 'orphan.md',
      orphanTags: ['#fruit'],
      orphanTokens: ['apple', 'banana'],
      candidates: [
        { path: 'unrelated.md', tags: ['#tech'], tokens: ['react', 'javascript', 'framework'] },
      ],
      corpus,
    });
    expect(result).toHaveLength(0);
  });

  it('scores candidates by tag overlap', () => {
    const corpus = buildCorpus({
      'orphan.md': ['cooking', 'recipe'],
      'related.md': ['cooking', 'baking'],
      'unrelated.md': ['programming', 'typescript'],
    });
    const result = LinkSuggestionService.findRelatedNotes({
      orphanPath: 'orphan.md',
      orphanTags: ['#cooking', '#recipe'],
      orphanTokens: ['cooking', 'recipe'],
      candidates: [
        { path: 'related.md', tags: ['#cooking', '#baking'], tokens: ['cooking', 'baking'] },
        { path: 'unrelated.md', tags: ['#programming'], tokens: ['programming', 'typescript'] },
      ],
      corpus,
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].path).toBe('related.md');
    expect(result[0].reason).toContain('tag overlap');
  });

  it('scores candidates by content similarity (TF-IDF)', () => {
    const corpus = buildCorpus({
      'orphan.md': ['machine', 'learning', 'neural', 'network', 'training'],
      'similar.md': ['machine', 'learning', 'deep', 'neural', 'network'],
      'different.md': ['gardening', 'plants', 'soil', 'water', 'sunlight'],
    });
    const result = LinkSuggestionService.findRelatedNotes({
      orphanPath: 'orphan.md',
      orphanTags: [],
      orphanTokens: ['machine', 'learning', 'neural', 'network', 'training'],
      candidates: [
        { path: 'similar.md', tags: [], tokens: ['machine', 'learning', 'deep', 'neural', 'network'] },
        { path: 'different.md', tags: [], tokens: ['gardening', 'plants', 'soil', 'water', 'sunlight'] },
      ],
      corpus,
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].path).toBe('similar.md');
  });

  it('scores candidates by filename similarity', () => {
    const corpus = buildCorpus({
      'notes/react-hooks-guide.md': ['hooks', 'state'],
      'notes/react-hooks-tutorial.md': ['hooks', 'tutorial'],
      'notes/cooking-basics.md': ['food', 'cooking'],
    });
    const result = LinkSuggestionService.findRelatedNotes({
      orphanPath: 'notes/react-hooks-guide.md',
      orphanTags: [],
      orphanTokens: ['hooks', 'state'],
      candidates: [
        { path: 'notes/react-hooks-tutorial.md', tags: [], tokens: ['hooks', 'tutorial'] },
        { path: 'notes/cooking-basics.md', tags: [], tokens: ['food', 'cooking'] },
      ],
      corpus,
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].path).toBe('notes/react-hooks-tutorial.md');
  });

  it('respects maxLinks limit', () => {
    const docs: Record<string, string[]> = { 'orphan.md': ['topic', 'shared'] };
    const candidates = [];
    for (let i = 0; i < 10; i++) {
      const path = `note-${i}.md`;
      docs[path] = ['topic', 'shared', `unique${i}`];
      candidates.push({ path, tags: ['#shared'], tokens: ['topic', 'shared', `unique${i}`] });
    }
    const corpus = buildCorpus(docs);
    const result = LinkSuggestionService.findRelatedNotes({
      orphanPath: 'orphan.md',
      orphanTags: ['#shared'],
      orphanTokens: ['topic', 'shared'],
      candidates,
      corpus,
      maxLinks: 3,
    });
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('excludes self from results', () => {
    const corpus = buildCorpus({ 'note.md': ['hello', 'world'] });
    const result = LinkSuggestionService.findRelatedNotes({
      orphanPath: 'note.md',
      orphanTags: ['#test'],
      orphanTokens: ['hello', 'world'],
      candidates: [
        { path: 'note.md', tags: ['#test'], tokens: ['hello', 'world'] },
      ],
      corpus,
    });
    expect(result).toHaveLength(0);
  });
});
