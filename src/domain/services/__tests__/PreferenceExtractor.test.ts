import { describe, it, expect } from 'vitest';
import { PreferenceExtractor } from '../PreferenceExtractor';
import type { OrganizeVaultProposal } from '../../models/OrganizeVaultPlan';
import type { PreferenceSignal } from '../../models/PreferenceModels';
import type { NotePath } from '../../values/NotePath';

function makeProposal(overrides: Partial<OrganizeVaultProposal> = {}): OrganizeVaultProposal {
  return {
    id: 'prop-1',
    type: 'reposition',
    targetPath: 'Notes/test.md' as NotePath,
    diffs: [{ field: 'folder', before: 'Notes', after: 'Projects' }],
    affectedPaths: [],
    confidence: 0.85,
    confidenceLevel: 'high',
    rationale: 'Better fit for Projects folder',
    status: 'pending',
    ...overrides,
  };
}

function makeSignal(overrides: Partial<PreferenceSignal> = {}): PreferenceSignal {
  return {
    id: 'sig-1',
    timestamp: 1000,
    action: 'approved',
    signalType: 'folder-routing',
    proposalType: 'reposition',
    context: {
      targetPath: 'Notes/test.md',
      diffs: [{ field: 'folder', before: 'Notes', after: 'Projects' }],
      rationale: 'Better fit',
      confidence: 0.85,
    },
    ...overrides,
  };
}

describe('PreferenceExtractor', () => {
  describe('extractSignal', () => {
    it('extracts folder-routing signal from reposition proposal', () => {
      const proposal = makeProposal();
      const signal = PreferenceExtractor.extractSignal(proposal, 'approved', 1000);

      expect(signal.action).toBe('approved');
      expect(signal.signalType).toBe('folder-routing');
      expect(signal.proposalType).toBe('reposition');
      expect(signal.timestamp).toBe(1000);
      expect(signal.context.targetPath).toBe('Notes/test.md');
      expect(signal.context.diffs).toHaveLength(1);
      expect(signal.context.confidence).toBe(0.85);
      expect(signal.id).toBeTruthy();
    });

    it('extracts tag-mapping signal from tag diff', () => {
      const proposal = makeProposal({
        type: 'merge-duplicate-tags',
        diffs: [{ field: 'tags', before: '#wip', after: '#draft' }],
      });
      const signal = PreferenceExtractor.extractSignal(proposal, 'approved', 2000);

      expect(signal.signalType).toBe('tag-mapping');
    });

    it('extracts link-suggestion signal from link diff', () => {
      const proposal = makeProposal({
        diffs: [{ field: 'suggestedLinks', before: '(none)', after: 'Related/note.md' }],
      });
      const signal = PreferenceExtractor.extractSignal(proposal, 'approved', 3000);

      expect(signal.signalType).toBe('link-suggestion');
    });

    it('extracts exclusion signal when rejecting Templates/ path', () => {
      const proposal = makeProposal({
        targetPath: 'Templates/header.md' as NotePath,
      });
      const signal = PreferenceExtractor.extractSignal(proposal, 'rejected', 4000);

      expect(signal.signalType).toBe('exclusion');
      expect(signal.action).toBe('rejected');
    });

    it('does not flag exclusion for non-Templates rejected proposals', () => {
      const proposal = makeProposal({
        targetPath: 'Notes/random.md' as NotePath,
      });
      const signal = PreferenceExtractor.extractSignal(proposal, 'rejected', 5000);

      expect(signal.signalType).toBe('folder-routing');
    });

    it('extracts property-template from frontmatter diff', () => {
      const proposal = makeProposal({
        diffs: [{ field: 'frontmatter', before: '(none)', after: 'status: active' }],
      });
      const signal = PreferenceExtractor.extractSignal(proposal, 'approved', 6000);

      expect(signal.signalType).toBe('property-template');
    });

    it('prioritizes link-suggestion over folder-routing when both present', () => {
      const proposal = makeProposal({
        diffs: [
          { field: 'folder', before: 'A', after: 'B' },
          { field: 'links', before: '(none)', after: 'target.md' },
        ],
      });
      const signal = PreferenceExtractor.extractSignal(proposal, 'approved', 7000);

      expect(signal.signalType).toBe('link-suggestion');
    });
  });

  describe('extractPattern', () => {
    it('extracts folder routing pattern', () => {
      const signal = makeSignal({ signalType: 'folder-routing' });
      expect(PreferenceExtractor.extractPattern(signal)).toBe('folder:Notes→Projects');
    });

    it('extracts tag mapping pattern', () => {
      const signal = makeSignal({
        signalType: 'tag-mapping',
        context: {
          ...makeSignal().context,
          diffs: [{ field: 'tags', before: '#wip', after: '#draft' }],
        },
      });
      expect(PreferenceExtractor.extractPattern(signal)).toBe('tag:#wip→#draft');
    });

    it('extracts exclusion pattern from path', () => {
      const signal = makeSignal({
        signalType: 'exclusion',
        context: {
          ...makeSignal().context,
          targetPath: 'Templates/header.md',
        },
      });
      expect(PreferenceExtractor.extractPattern(signal)).toBe('exclude:Templates/*');
    });

    it('extracts link suggestion pattern', () => {
      const signal = makeSignal({
        signalType: 'link-suggestion',
        context: {
          ...makeSignal().context,
          diffs: [{ field: 'suggestedLinks', before: '(none)', after: 'Related/note.md' }],
        },
      });
      expect(PreferenceExtractor.extractPattern(signal)).toBe('link:Related/note.md');
    });
  });

  describe('deriveRules', () => {
    it('creates rule when pattern hits threshold', () => {
      const signals = [
        makeSignal({ id: 'a', timestamp: 1000 }),
        makeSignal({ id: 'b', timestamp: 2000 }),
        makeSignal({ id: 'c', timestamp: 3000 }),
      ];

      const rules = PreferenceExtractor.deriveRules(signals, 3);

      expect(rules).toHaveLength(1);
      expect(rules[0].ruleType).toBe('folder-routing');
      expect(rules[0].pattern).toBe('folder:Notes→Projects');
      expect(rules[0].action).toBe('approved');
      expect(rules[0].hitCount).toBe(3);
      expect(rules[0].lastTriggered).toBe(3000);
      expect(rules[0].examples).toHaveLength(3);
      expect(rules[0].source).toBe('learned');
    });

    it('does not create rule below threshold', () => {
      const signals = [
        makeSignal({ id: 'a', timestamp: 1000 }),
        makeSignal({ id: 'b', timestamp: 2000 }),
      ];

      const rules = PreferenceExtractor.deriveRules(signals, 3);
      expect(rules).toHaveLength(0);
    });

    it('groups different patterns separately', () => {
      const signals = [
        makeSignal({ id: 'a', timestamp: 1000 }),
        makeSignal({ id: 'b', timestamp: 2000 }),
        makeSignal({ id: 'c', timestamp: 3000 }),
        makeSignal({
          id: 'd', timestamp: 4000,
          signalType: 'tag-mapping',
          context: { ...makeSignal().context, diffs: [{ field: 'tags', before: '#wip', after: '#draft' }] },
        }),
        makeSignal({
          id: 'e', timestamp: 5000,
          signalType: 'tag-mapping',
          context: { ...makeSignal().context, diffs: [{ field: 'tags', before: '#wip', after: '#draft' }] },
        }),
        makeSignal({
          id: 'f', timestamp: 6000,
          signalType: 'tag-mapping',
          context: { ...makeSignal().context, diffs: [{ field: 'tags', before: '#wip', after: '#draft' }] },
        }),
      ];

      const rules = PreferenceExtractor.deriveRules(signals, 3);
      expect(rules).toHaveLength(2);
    });

    it('separates approve and reject for same pattern', () => {
      const signals = [
        makeSignal({ id: 'a', timestamp: 1000, action: 'approved' }),
        makeSignal({ id: 'b', timestamp: 2000, action: 'approved' }),
        makeSignal({ id: 'c', timestamp: 3000, action: 'approved' }),
        makeSignal({ id: 'd', timestamp: 4000, action: 'rejected' }),
        makeSignal({ id: 'e', timestamp: 5000, action: 'rejected' }),
      ];

      const rules = PreferenceExtractor.deriveRules(signals, 3);
      expect(rules).toHaveLength(1);
      expect(rules[0].action).toBe('approved');
    });

    it('sorts rules by hitCount descending', () => {
      const tagSignals = Array.from({ length: 5 }, (_, i) => makeSignal({
        id: `tag-${i}`, timestamp: i * 1000,
        signalType: 'tag-mapping',
        context: { ...makeSignal().context, diffs: [{ field: 'tags', before: '#a', after: '#b' }] },
      }));
      const folderSignals = Array.from({ length: 3 }, (_, i) => makeSignal({
        id: `folder-${i}`, timestamp: (i + 10) * 1000,
      }));

      const rules = PreferenceExtractor.deriveRules([...tagSignals, ...folderSignals], 3);
      expect(rules).toHaveLength(2);
      expect(rules[0].hitCount).toBe(5);
      expect(rules[1].hitCount).toBe(3);
    });

    it('limits examples to 3 most recent', () => {
      const signals = Array.from({ length: 7 }, (_, i) => makeSignal({
        id: `sig-${i}`, timestamp: i * 1000,
      }));

      const rules = PreferenceExtractor.deriveRules(signals, 3);
      expect(rules[0].examples).toHaveLength(3);
    });
  });

  describe('trimSignals', () => {
    it('returns all signals when under max', () => {
      const signals = [makeSignal({ id: 'a' }), makeSignal({ id: 'b' })];
      const trimmed = PreferenceExtractor.trimSignals(signals, 5);
      expect(trimmed).toHaveLength(2);
    });

    it('keeps most recent signals when over max', () => {
      const signals = [
        makeSignal({ id: 'old', timestamp: 100 }),
        makeSignal({ id: 'mid', timestamp: 200 }),
        makeSignal({ id: 'new', timestamp: 300 }),
      ];

      const trimmed = PreferenceExtractor.trimSignals(signals, 2);
      expect(trimmed).toHaveLength(2);
      expect(trimmed[0].id).toBe('mid');
      expect(trimmed[1].id).toBe('new');
    });

    it('handles exact max count', () => {
      const signals = [makeSignal({ id: 'a' }), makeSignal({ id: 'b' })];
      const trimmed = PreferenceExtractor.trimSignals(signals, 2);
      expect(trimmed).toHaveLength(2);
    });
  });

  describe('buildFewShotExamples', () => {
    it('builds examples from recent signals', () => {
      const signals = [
        makeSignal({ id: 'a', timestamp: 1000, action: 'approved' }),
        makeSignal({ id: 'b', timestamp: 2000, action: 'rejected' }),
      ];

      const examples = PreferenceExtractor.buildFewShotExamples(signals, 10);
      expect(examples).toHaveLength(2);
      expect(examples[0].action).toBe('rejected');
      expect(examples[1].action).toBe('approved');
    });

    it('respects max count', () => {
      const signals = Array.from({ length: 20 }, (_, i) => makeSignal({
        id: `sig-${i}`,
        timestamp: i * 1000,
        context: {
          ...makeSignal().context,
          targetPath: `Notes/note-${i}.md`,
          diffs: [{ field: 'folder', before: `Folder${i}`, after: `Target${i}` }],
        },
      }));

      const examples = PreferenceExtractor.buildFewShotExamples(signals, 5);
      expect(examples).toHaveLength(5);
    });

    it('deduplicates by pattern and action', () => {
      const signals = [
        makeSignal({ id: 'a', timestamp: 3000, action: 'approved' }),
        makeSignal({ id: 'b', timestamp: 2000, action: 'approved' }),
        makeSignal({ id: 'c', timestamp: 1000, action: 'rejected' }),
      ];

      const examples = PreferenceExtractor.buildFewShotExamples(signals, 10);
      expect(examples).toHaveLength(2);
    });

    it('includes input and output fields', () => {
      const signals = [makeSignal({ id: 'a', timestamp: 1000 })];
      const examples = PreferenceExtractor.buildFewShotExamples(signals, 10);

      expect(examples[0].input).toContain('Notes/test.md');
      expect(examples[0].output).toContain('Projects');
    });

    it('returns empty array for empty signals', () => {
      const examples = PreferenceExtractor.buildFewShotExamples([], 10);
      expect(examples).toHaveLength(0);
    });
  });
});
