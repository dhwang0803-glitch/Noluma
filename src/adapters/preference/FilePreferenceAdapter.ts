import type { PreferencePort } from '../../application/ports/PreferencePort';
import type { VaultAccessPort } from '../../application/ports/VaultAccessPort';
import type {
  PreferenceRuleSet,
  PreferenceSignal,
  PreferenceSignalType,
  PreferenceActionType,
  PreferenceRule,
} from '../../domain/models/PreferenceModels';
import { createEmptyRuleSet } from '../../domain/models/PreferenceModels';
import { PreferenceExtractor } from '../../domain/services/PreferenceExtractor';
import { PreferencePromptEnricher } from '../../application/PreferencePromptEnricher';
import {
  PREFERENCES_PATH,
  PREFERENCE_SIGNAL_MAX,
  PREFERENCE_FEWSHOT_MAX,
  PREFERENCE_RULE_THRESHOLD,
} from '../../constants';

export class FilePreferenceAdapter implements PreferencePort {
  constructor(
    private readonly vault: VaultAccessPort,
  ) {}

  async load(): Promise<PreferenceRuleSet | null> {
    const raw = await this.vault.readFileRaw(PREFERENCES_PATH);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as PreferenceRuleSet;
      return {
        ...parsed,
        rules: parsed.rules.map(r => ({ ...r, source: r.source ?? 'learned' })),
      };
    } catch {
      return null;
    }
  }

  async save(ruleSet: PreferenceRuleSet): Promise<void> {
    await this.vault.writeFileRaw(PREFERENCES_PATH, JSON.stringify(ruleSet, null, 2));
  }

  async recordSignal(signal: PreferenceSignal): Promise<PreferenceRuleSet> {
    const existing = (await this.load()) ?? createEmptyRuleSet();

    const allSignals = PreferenceExtractor.trimSignals(
      [...existing.signals, signal],
      PREFERENCE_SIGNAL_MAX,
    );

    const manualRules = existing.rules.filter(r => r.source === 'manual');
    const learnedRules = PreferenceExtractor.deriveRules(allSignals, PREFERENCE_RULE_THRESHOLD);
    const fewShotExamples = PreferenceExtractor.buildFewShotExamples(allSignals, PREFERENCE_FEWSHOT_MAX);

    const updated: PreferenceRuleSet = {
      version: existing.version,
      rules: [...manualRules, ...learnedRules],
      signals: allSignals,
      fewShotExamples,
      lastUpdated: signal.timestamp,
    };

    await this.save(updated);
    return updated;
  }

  async deleteRule(ruleId: string): Promise<void> {
    const ruleSet = await this.load();
    if (!ruleSet) return;

    const deletedRule = ruleSet.rules.find(r => r.id === ruleId);
    let filteredSignals = ruleSet.signals;

    if (deletedRule && deletedRule.source === 'learned') {
      filteredSignals = ruleSet.signals.filter(s => {
        const pattern = PreferenceExtractor.extractPattern(s);
        return !(s.signalType === deletedRule.ruleType
          && pattern === deletedRule.pattern
          && s.action === deletedRule.action);
      });
    }

    const updated: PreferenceRuleSet = {
      ...ruleSet,
      rules: ruleSet.rules.filter(r => r.id !== ruleId),
      signals: filteredSignals,
    };
    await this.save(updated);
  }

  async resetAll(): Promise<void> {
    await this.save(createEmptyRuleSet());
  }

  async addManualRule(
    ruleType: PreferenceSignalType,
    pattern: string,
    action: PreferenceActionType,
  ): Promise<void> {
    const existing = (await this.load()) ?? createEmptyRuleSet();

    const newRule: PreferenceRule = {
      id: crypto.randomUUID(),
      ruleType,
      pattern,
      action,
      hitCount: 0,
      lastTriggered: Date.now(),
      examples: [],
      source: 'manual',
    };

    const updated: PreferenceRuleSet = {
      ...existing,
      rules: [newRule, ...existing.rules],
      lastUpdated: Date.now(),
    };

    await this.save(updated);
  }

  async getPreferenceContext(mode: 'organize' | 'refactor'): Promise<string> {
    const ruleSet = await this.load();
    if (!ruleSet || (ruleSet.rules.length === 0 && ruleSet.fewShotExamples.length === 0)) {
      return '';
    }
    return PreferencePromptEnricher.buildPreferenceBlock(
      ruleSet.rules,
      ruleSet.fewShotExamples,
      mode,
    );
  }
}
