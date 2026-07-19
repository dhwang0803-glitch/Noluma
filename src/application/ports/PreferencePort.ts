import type {
  PreferenceRuleSet,
  PreferenceSignal,
  PreferenceSignalType,
  PreferenceActionType,
  RejectDecayEntry,
} from '../../domain/models/PreferenceModels';

export interface PreferencePort {
  load(): Promise<PreferenceRuleSet | null>;
  save(ruleSet: PreferenceRuleSet): Promise<void>;
  recordSignal(signal: PreferenceSignal): Promise<PreferenceRuleSet>;
  getPreferenceContext(mode: 'organize' | 'refactor'): Promise<string>;
  deleteRule(ruleId: string): Promise<void>;
  resetAll(): Promise<void>;
  addManualRule(ruleType: PreferenceSignalType, pattern: string, action: PreferenceActionType): Promise<void>;
  getSuppressedFingerprints(now: number): Promise<ReadonlyArray<string>>;
  unsuppress(id: string): Promise<void>;
  getSuppressions(): Promise<ReadonlyArray<RejectDecayEntry>>;
}
