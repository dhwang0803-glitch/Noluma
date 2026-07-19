import { describe, it, expect } from 'vitest';
import { FuzzyLinkMatcher } from '../FuzzyLinkMatcher';

describe('FuzzyLinkMatcher', () => {
  const basenames = [
    'meeting-notes',
    'react-hooks',
    'typescript-guide',
    'cooking-basics',
    'machine-learning',
    'daily-journal',
  ];

  it('finds exact case-insensitive match', () => {
    const result = FuzzyLinkMatcher.findBestMatch('React-Hooks', basenames);
    expect(result).not.toBeNull();
    expect(result!.target).toBe('react-hooks');
    expect(result!.score).toBe(1.0);
  });

  it('finds match with small Levenshtein distance', () => {
    const result = FuzzyLinkMatcher.findBestMatch('react-hook', basenames);
    expect(result).not.toBeNull();
    expect(result!.target).toBe('react-hooks');
    expect(result!.score).toBeGreaterThan(0.8);
  });

  it('finds substring match', () => {
    const result = FuzzyLinkMatcher.findBestMatch('daily-journal-2025', basenames);
    expect(result).not.toBeNull();
    expect(result!.target).toBe('daily-journal');
    expect(result!.score).toBeGreaterThanOrEqual(0.6);
  });

  it('finds match via token overlap', () => {
    const result = FuzzyLinkMatcher.findBestMatch('machine-learning-basics', basenames);
    expect(result).not.toBeNull();
    expect(result!.target).toBe('machine-learning');
  });

  it('returns null when no match above threshold', () => {
    const result = FuzzyLinkMatcher.findBestMatch('quantum-physics', basenames);
    expect(result).toBeNull();
  });

  it('returns null for empty basenames', () => {
    const result = FuzzyLinkMatcher.findBestMatch('test', []);
    expect(result).toBeNull();
  });

  it('strips .md extension during comparison', () => {
    const result = FuzzyLinkMatcher.findBestMatch('react-hooks.md', basenames);
    expect(result).not.toBeNull();
    expect(result!.target).toBe('react-hooks');
    expect(result!.score).toBe(1.0);
  });

  it('respects custom threshold', () => {
    const result = FuzzyLinkMatcher.findBestMatch('react-hook', basenames, 0.99);
    expect(result).toBeNull();
  });

  it('handles single character typo', () => {
    const result = FuzzyLinkMatcher.findBestMatch('typescirpt-guide', basenames);
    expect(result).not.toBeNull();
    expect(result!.target).toBe('typescript-guide');
  });
});
