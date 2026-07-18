import { describe, it, expect } from 'vitest';
import { PreferencePromptEnricher } from '../PreferencePromptEnricher';
import type { PreferenceRule, FewShotExample } from '../../domain/models/PreferenceModels';

function makeRule(overrides: Partial<PreferenceRule> = {}): PreferenceRule {
  return {
    id: 'rule-1',
    ruleType: 'folder-routing',
    pattern: 'folder:Notes→Projects',
    action: 'approved',
    hitCount: 5,
    lastTriggered: 1000,
    examples: [],
    source: 'learned',
    ...overrides,
  };
}

function makeFewShot(overrides: Partial<FewShotExample> = {}): FewShotExample {
  return {
    input: 'Note "meeting.md" — current: folder: Root',
    output: 'Suggestion: folder: Meetings (approved)',
    action: 'approved',
    ...overrides,
  };
}

describe('PreferencePromptEnricher', () => {
  describe('buildPreferenceBlock', () => {
    it('returns empty string when no rules or examples', () => {
      expect(PreferencePromptEnricher.buildPreferenceBlock([], [], 'organize')).toBe('');
    });

    it('includes priority directive stating core instructions take precedence', () => {
      const rules = [makeRule()];
      const result = PreferencePromptEnricher.buildPreferenceBlock(rules, [], 'organize');

      expect(result).toContain('advisory');
      expect(result).toContain('core instructions take priority');
    });

    it('includes header and rules section', () => {
      const rules = [makeRule()];
      const result = PreferencePromptEnricher.buildPreferenceBlock(rules, [], 'organize');

      expect(result).toContain('User Preferences');
      expect(result).toContain('Learned rules');
      expect(result).toContain('Always move notes from "Notes" to "Projects"');
    });

    it('renders rejection rules with Never prefix', () => {
      const rules = [makeRule({ action: 'rejected', pattern: 'folder:Archive→Root' })];
      const result = PreferencePromptEnricher.buildPreferenceBlock(rules, [], 'organize');

      expect(result).toContain('Never move notes from "Archive" to "Root"');
    });

    it('renders exclusion rules correctly', () => {
      const rules = [makeRule({ ruleType: 'exclusion', pattern: 'exclude:Templates/*' })];
      const result = PreferencePromptEnricher.buildPreferenceBlock(rules, [], 'organize');

      expect(result).toContain('Never touch notes in "Templates/*" folder');
    });

    it('renders tag-mapping rules', () => {
      const rules = [makeRule({ ruleType: 'tag-mapping', pattern: 'tag:#wip→#draft' })];
      const result = PreferencePromptEnricher.buildPreferenceBlock(rules, [], 'organize');

      expect(result).toContain('merge tag #wip into #draft');
    });

    it('includes few-shot examples section', () => {
      const examples = [makeFewShot()];
      const result = PreferencePromptEnricher.buildPreferenceBlock([], examples, 'organize');

      expect(result).toContain('Examples of past decisions');
      expect(result).toContain('meeting.md');
      expect(result).toContain('(approved)');
    });

    it('includes both rules and examples', () => {
      const rules = [makeRule()];
      const examples = [makeFewShot()];
      const result = PreferencePromptEnricher.buildPreferenceBlock(rules, examples, 'organize');

      expect(result).toContain('Learned rules');
      expect(result).toContain('Examples of past decisions');
    });

    it('starts with newlines for clean append', () => {
      const rules = [makeRule()];
      const result = PreferencePromptEnricher.buildPreferenceBlock(rules, [], 'organize');

      expect(result.startsWith('\n\n[')).toBe(true);
    });

    it('ends with closing delimiter', () => {
      const rules = [makeRule()];
      const result = PreferencePromptEnricher.buildPreferenceBlock(rules, [], 'organize');

      expect(result.trimEnd().endsWith('[End User Preferences]')).toBe(true);
    });

    it('handles multiple rules', () => {
      const rules = [
        makeRule({ pattern: 'folder:A→B' }),
        makeRule({ id: 'r2', ruleType: 'tag-mapping', pattern: 'tag:#x→#y' }),
        makeRule({ id: 'r3', ruleType: 'exclusion', pattern: 'exclude:Templates/*' }),
      ];
      const result = PreferencePromptEnricher.buildPreferenceBlock(rules, [], 'organize');

      expect(result).toContain('"A" to "B"');
      expect(result).toContain('#x into #y');
      expect(result).toContain('Templates/*');
    });

    it('handles rejected few-shot examples', () => {
      const examples = [makeFewShot({ action: 'rejected' })];
      const result = PreferencePromptEnricher.buildPreferenceBlock([], examples, 'organize');

      expect(result).toContain('(rejected)');
    });

    it('renders manual rules before learned rules with separate headers', () => {
      const rules = [
        makeRule({ id: 'learned-1', source: 'learned', pattern: 'folder:A→B' }),
        makeRule({ id: 'manual-1', source: 'manual', pattern: 'exclude:Templates/*', ruleType: 'exclusion' }),
      ];
      const result = PreferencePromptEnricher.buildPreferenceBlock(rules, [], 'organize');

      expect(result).toContain('User-defined rules');
      expect(result).toContain('Learned rules');
      const manualIdx = result.indexOf('User-defined rules');
      const learnedIdx = result.indexOf('Learned rules');
      expect(manualIdx).toBeLessThan(learnedIdx);
    });

    it('only shows learned header when no manual rules exist', () => {
      const rules = [makeRule({ source: 'learned' })];
      const result = PreferencePromptEnricher.buildPreferenceBlock(rules, [], 'organize');

      expect(result).not.toContain('User-defined rules');
      expect(result).toContain('Learned rules');
    });

    it('truncates when suffix gets too long', () => {
      const rules = Array.from({ length: 100 }, (_, i) =>
        makeRule({ id: `r-${i}`, pattern: `folder:VeryLongFolderName${i}→AnotherVeryLongFolder${i}` }),
      );

      const result = PreferencePromptEnricher.buildPreferenceBlock(rules, [], 'organize');
      expect(result.length).toBeLessThan(3000);
    });
  });
});
