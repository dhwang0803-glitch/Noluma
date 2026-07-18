import { describe, it, expect, vi } from 'vitest';
import { RecordPreferenceUseCase } from '../RecordPreferenceUseCase';
import { createMockPreference, createMockClock } from '../../../test-utils/mock-ports';
import type { OrganizeVaultProposal } from '../../../domain/models/OrganizeVaultPlan';
import type { NotePath } from '../../../domain/values/NotePath';
import type { PreferenceRuleSet } from '../../../domain/models/PreferenceModels';

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

describe('RecordPreferenceUseCase', () => {
  it('records an approved signal via PreferencePort', async () => {
    const preference = createMockPreference();
    const clock = createMockClock(1720000000000);
    const useCase = new RecordPreferenceUseCase(preference, clock);

    await useCase.execute(makeProposal(), 'approved');

    expect(preference.recordSignal).toHaveBeenCalledTimes(1);
    const signal = (preference.recordSignal as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(signal.action).toBe('approved');
    expect(signal.signalType).toBe('folder-routing');
    expect(signal.proposalType).toBe('reposition');
    expect(signal.timestamp).toBe(1720000000000);
    expect(signal.context.targetPath).toBe('Notes/test.md');
  });

  it('records a rejected signal', async () => {
    const preference = createMockPreference();
    const clock = createMockClock(1720000001000);
    const useCase = new RecordPreferenceUseCase(preference, clock);

    await useCase.execute(makeProposal(), 'rejected');

    const signal = (preference.recordSignal as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(signal.action).toBe('rejected');
  });

  it('extracts tag-mapping signal for tag proposals', async () => {
    const preference = createMockPreference();
    const clock = createMockClock();
    const useCase = new RecordPreferenceUseCase(preference, clock);

    const proposal = makeProposal({
      type: 'merge-duplicate-tags',
      diffs: [{ field: 'tags', before: '#wip', after: '#draft' }],
    });

    await useCase.execute(proposal, 'approved');

    const signal = (preference.recordSignal as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(signal.signalType).toBe('tag-mapping');
  });

  it('uses clock timestamp for signal', async () => {
    const preference = createMockPreference();
    const clock = createMockClock(9999999);
    const useCase = new RecordPreferenceUseCase(preference, clock);

    await useCase.execute(makeProposal(), 'approved');

    const signal = (preference.recordSignal as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(signal.timestamp).toBe(9999999);
  });

  it('returns the updated rule set from recordSignal', async () => {
    const updatedRuleSet: PreferenceRuleSet = {
      version: 1,
      rules: [{ id: 'r1', ruleType: 'folder-routing', pattern: 'folder:A→B', action: 'approved', hitCount: 3, lastTriggered: 1000, examples: [] }],
      signals: [],
      fewShotExamples: [],
      lastUpdated: 1000,
    };
    const preference = createMockPreference({
      recordSignal: vi.fn().mockResolvedValue(updatedRuleSet),
    });
    const clock = createMockClock();
    const useCase = new RecordPreferenceUseCase(preference, clock);

    await useCase.execute(makeProposal(), 'approved');

    expect(preference.recordSignal).toHaveBeenCalledTimes(1);
  });
});
