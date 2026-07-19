import type { PreferencePort } from '../../application/ports/PreferencePort';
import type { VaultAccessPort } from '../../application/ports/VaultAccessPort';
import type { ConfigPort } from '../../application/ports/ConfigPort';
import type {
  PreferenceRuleSet,
  PreferenceSignal,
  PreferenceSignalType,
  PreferenceActionType,
  PreferenceRule,
  RejectDecayEntry,
} from '../../domain/models/PreferenceModels';
import { createEmptyRuleSet } from '../../domain/models/PreferenceModels';
import { PreferenceExtractor } from '../../domain/services/PreferenceExtractor';
import { PreferencePromptEnricher } from '../../application/PreferencePromptEnricher';
import {
  PREFERENCES_PATH,
  PREFERENCE_SIGNAL_MAX,
  PREFERENCE_FEWSHOT_MAX,
  PREFERENCE_RULE_THRESHOLD,
  PREFERENCE_REJECT_DECAY_DAYS,
} from '../../constants';

export class FilePreferenceAdapter implements PreferencePort {
  private writeLock: Promise<void> = Promise.resolve();

  constructor(
    private readonly vault: VaultAccessPort,
    private readonly config?: ConfigPort,
  ) {}

  private serialized<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.writeLock.then(fn, fn);
    this.writeLock = next.then(() => {}, () => {});
    return next;
  }

  async load(): Promise<PreferenceRuleSet | null> {
    const raw = await this.vault.readFileRaw(PREFERENCES_PATH);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as PreferenceRuleSet & { suppressions?: ReadonlyArray<RejectDecayEntry> };
      return {
        ...parsed,
        rules: parsed.rules.map(r => ({ ...r, source: r.source ?? 'learned' })),
        suppressions: parsed.suppressions ?? [],
      };
    } catch {
      return null;
    }
  }

  async save(ruleSet: PreferenceRuleSet): Promise<void> {
    await this.vault.writeFileRaw(PREFERENCES_PATH, JSON.stringify(ruleSet, null, 2));
  }

  async recordSignal(signal: PreferenceSignal): Promise<PreferenceRuleSet> {
    return this.serialized(async () => {
      const existing = (await this.load()) ?? createEmptyRuleSet();

      const allSignals = PreferenceExtractor.trimSignals(
        [...existing.signals, signal],
        PREFERENCE_SIGNAL_MAX,
      );

      const manualRules = existing.rules.filter(r => r.source === 'manual');
      const learnedRules = PreferenceExtractor.deriveRules(allSignals, PREFERENCE_RULE_THRESHOLD);
      const fewShotExamples = PreferenceExtractor.buildFewShotExamples(allSignals, PREFERENCE_FEWSHOT_MAX);

      let suppressions = [...existing.suppressions].filter(s => s.expiresAt > signal.timestamp);

      if (signal.action === 'rejected') {
        const fingerprint = this.computeFingerprint(signal);
        const promotedPatterns = new Set(learnedRules.filter(r => r.action === 'rejected').map(r => `${r.ruleType}|${r.pattern}`));
        const isPromoted = promotedPatterns.has(`${signal.signalType}|${PreferenceExtractor.extractPattern(signal)}`);

        if (!isPromoted && !suppressions.some(s => s.fingerprint === fingerprint)) {
          const decayDays = this.config
            ? (await this.config.getSettings()).rejectDecayDays
            : PREFERENCE_REJECT_DECAY_DAYS;
          const entry: RejectDecayEntry = {
            id: crypto.randomUUID(),
            fingerprint,
            rejectedAt: signal.timestamp,
            expiresAt: signal.timestamp + decayDays * 86_400_000,
            label: `${signal.signalType}: ${signal.context.targetPath}`,
          };
          suppressions.push(entry);
        }

        suppressions = suppressions.filter(s => !promotedPatterns.has(s.fingerprint.split('|').slice(0, 2).join('|')));
      }

      const updated: PreferenceRuleSet = {
        version: existing.version,
        rules: [...manualRules, ...learnedRules],
        signals: allSignals,
        fewShotExamples,
        suppressions,
        lastUpdated: signal.timestamp,
      };

      await this.save(updated);
      return updated;
    });
  }

  private computeFingerprint(signal: PreferenceSignal): string {
    const pattern = PreferenceExtractor.extractPattern(signal);
    return `${signal.signalType}|${pattern}|${signal.proposalType}`;
  }

  async deleteRule(ruleId: string): Promise<void> {
    return this.serialized(async () => {
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
    });
  }

  async resetAll(): Promise<void> {
    await this.save(createEmptyRuleSet());
  }

  async addManualRule(
    ruleType: PreferenceSignalType,
    pattern: string,
    action: PreferenceActionType,
  ): Promise<void> {
    return this.serialized(async () => {
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
    });
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

  async getSuppressedFingerprints(now: number): Promise<ReadonlyArray<string>> {
    const ruleSet = await this.load();
    if (!ruleSet) return [];
    return ruleSet.suppressions
      .filter(s => s.expiresAt > now)
      .map(s => s.fingerprint);
  }

  async unsuppress(id: string): Promise<void> {
    return this.serialized(async () => {
      const ruleSet = await this.load();
      if (!ruleSet) return;
      const updated: PreferenceRuleSet = {
        ...ruleSet,
        suppressions: ruleSet.suppressions.filter(s => s.id !== id),
      };
      await this.save(updated);
    });
  }

  async getSuppressions(): Promise<ReadonlyArray<RejectDecayEntry>> {
    const ruleSet = await this.load();
    if (!ruleSet) return [];
    return ruleSet.suppressions;
  }
}
