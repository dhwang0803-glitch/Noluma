import type { ProposalType } from './OrganizeVaultPlan';

export type PreferenceActionType = 'approved' | 'rejected';

export type PreferenceSignalType =
  | 'folder-routing'
  | 'tag-mapping'
  | 'exclusion'
  | 'property-template'
  | 'link-suggestion';

export interface SignalContext {
  readonly targetPath: string;
  readonly diffs: ReadonlyArray<{ field: string; before: string; after: string }>;
  readonly rationale: string;
  readonly confidence: number;
  readonly metadata?: Record<string, unknown>;
}

export interface PreferenceSignal {
  readonly id: string;
  readonly timestamp: number;
  readonly action: PreferenceActionType;
  readonly signalType: PreferenceSignalType;
  readonly proposalType: ProposalType;
  readonly context: SignalContext;
}

export type PreferenceRuleSource = 'learned' | 'manual';

export interface PreferenceRule {
  readonly id: string;
  readonly ruleType: PreferenceSignalType;
  readonly pattern: string;
  readonly action: PreferenceActionType;
  readonly hitCount: number;
  readonly lastTriggered: number;
  readonly examples: ReadonlyArray<string>;
  readonly source: PreferenceRuleSource;
}

export interface FewShotExample {
  readonly input: string;
  readonly output: string;
  readonly action: PreferenceActionType;
}

export interface PreferenceRuleSet {
  readonly version: number;
  readonly rules: ReadonlyArray<PreferenceRule>;
  readonly signals: ReadonlyArray<PreferenceSignal>;
  readonly fewShotExamples: ReadonlyArray<FewShotExample>;
  readonly lastUpdated: number;
}

export function createEmptyRuleSet(): PreferenceRuleSet {
  return {
    version: 1,
    rules: [],
    signals: [],
    fewShotExamples: [],
    lastUpdated: 0,
  };
}
