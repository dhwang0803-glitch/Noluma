import type { OrganizeVaultProposal, ProposalDiff } from '../models/OrganizeVaultPlan';
import type {
  PreferenceActionType,
  PreferenceSignal,
  PreferenceSignalType,
  PreferenceRule,
  FewShotExample,
} from '../models/PreferenceModels';

export class PreferenceExtractor {
  static extractSignal(
    proposal: OrganizeVaultProposal,
    action: PreferenceActionType,
    timestamp: number,
  ): PreferenceSignal {
    return {
      id: crypto.randomUUID(),
      timestamp,
      action,
      signalType: PreferenceExtractor.inferSignalType(proposal, action),
      proposalType: proposal.type,
      context: {
        targetPath: proposal.targetPath as string,
        diffs: proposal.diffs.map(d => ({ field: d.field, before: d.before, after: d.after })),
        rationale: proposal.rationale,
        confidence: proposal.confidence,
        metadata: undefined,
      },
    };
  }

  static deriveRules(
    signals: ReadonlyArray<PreferenceSignal>,
    threshold: number = 3,
  ): ReadonlyArray<PreferenceRule> {
    const groups = new Map<string, PreferenceSignal[]>();

    for (const signal of signals) {
      const pattern = PreferenceExtractor.extractPattern(signal);
      const key = `${signal.signalType}|${pattern}|${signal.action}`;
      const group = groups.get(key);
      if (group) {
        group.push(signal);
      } else {
        groups.set(key, [signal]);
      }
    }

    const rules: PreferenceRule[] = [];
    for (const [key, group] of groups) {
      if (group.length < threshold) continue;

      const [ruleType, pattern, action] = key.split('|') as [PreferenceSignalType, string, PreferenceActionType];
      const sorted = [...group].sort((a, b) => b.timestamp - a.timestamp);
      const examples = sorted
        .slice(0, 3)
        .map(s => PreferenceExtractor.summarizeSignal(s));

      rules.push({
        id: crypto.randomUUID(),
        ruleType,
        pattern,
        action,
        hitCount: group.length,
        lastTriggered: sorted[0].timestamp,
        examples,
        source: 'learned',
      });
    }

    return rules.sort((a, b) => b.hitCount - a.hitCount);
  }

  static trimSignals(
    signals: ReadonlyArray<PreferenceSignal>,
    maxCount: number,
  ): ReadonlyArray<PreferenceSignal> {
    if (signals.length <= maxCount) return signals;
    const sorted = [...signals].sort((a, b) => a.timestamp - b.timestamp);
    return sorted.slice(sorted.length - maxCount);
  }

  static buildFewShotExamples(
    signals: ReadonlyArray<PreferenceSignal>,
    maxCount: number,
  ): ReadonlyArray<FewShotExample> {
    const recent = [...signals]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxCount * 2);

    const seen = new Set<string>();
    const examples: FewShotExample[] = [];

    for (const signal of recent) {
      if (examples.length >= maxCount) break;

      const pattern = PreferenceExtractor.extractPattern(signal);
      const dedupeKey = `${pattern}|${signal.action}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const input = PreferenceExtractor.buildFewShotInput(signal);
      const output = PreferenceExtractor.buildFewShotOutput(signal);

      examples.push({ input, output, action: signal.action });
    }

    return examples;
  }

  private static inferSignalType(
    proposal: OrganizeVaultProposal,
    action: PreferenceActionType,
  ): PreferenceSignalType {
    if (action === 'rejected' && PreferenceExtractor.isExclusionCandidate(proposal)) {
      return 'exclusion';
    }

    const hasFolderDiff = proposal.diffs.some(d => d.field === 'folder');
    const hasTagDiff = proposal.diffs.some(d => d.field === 'tags');
    const hasLinkDiff = proposal.diffs.some(d => d.field === 'links' || d.field === 'suggestedLinks');

    if (hasLinkDiff) return 'link-suggestion';
    if (hasFolderDiff) return 'folder-routing';
    if (hasTagDiff) return 'tag-mapping';
    if (proposal.diffs.some(d => d.field === 'frontmatter' || d.field === 'properties')) {
      return 'property-template';
    }

    return hasFolderDiff ? 'folder-routing' : 'tag-mapping';
  }

  static computeProposalFingerprint(proposal: OrganizeVaultProposal): string {
    const signalType = PreferenceExtractor.inferSignalType(proposal, 'rejected');
    const mockSignal: PreferenceSignal = {
      id: '', timestamp: 0, action: 'rejected',
      signalType,
      proposalType: proposal.type,
      context: {
        targetPath: proposal.targetPath as string,
        diffs: proposal.diffs.map(d => ({ field: d.field, before: d.before, after: d.after })),
        rationale: '', confidence: 0,
      },
    };
    const pattern = PreferenceExtractor.extractPattern(mockSignal);
    return `${signalType}|${pattern}|${proposal.type}`;
  }

  private static isExclusionCandidate(proposal: OrganizeVaultProposal): boolean {
    const path = proposal.targetPath as string;
    return path.includes('Templates/') || path.includes('templates/');
  }

  static extractPattern(signal: PreferenceSignal): string {
    const diffs = signal.context.diffs;

    switch (signal.signalType) {
      case 'folder-routing': {
        const folderDiff = diffs.find(d => d.field === 'folder');
        if (folderDiff) return `folder:${folderDiff.before}→${folderDiff.after}`;
        return `folder:unknown`;
      }
      case 'tag-mapping': {
        const tagDiff = diffs.find(d => d.field === 'tags');
        if (tagDiff) return `tag:${tagDiff.before}→${tagDiff.after}`;
        return `tag:unknown`;
      }
      case 'exclusion': {
        const folder = PreferenceExtractor.extractFolder(signal.context.targetPath);
        return `exclude:${folder}/*`;
      }
      case 'link-suggestion': {
        const linkDiff = diffs.find(d => d.field === 'links' || d.field === 'suggestedLinks');
        if (linkDiff) return `link:${linkDiff.after}`;
        return `link:unknown`;
      }
      case 'property-template': {
        const propDiff = diffs.find(d => d.field === 'frontmatter' || d.field === 'properties');
        if (propDiff) return `prop:${propDiff.after}`;
        return `prop:unknown`;
      }
    }
  }

  private static extractFolder(path: string): string {
    const lastSlash = path.lastIndexOf('/');
    return lastSlash >= 0 ? path.substring(0, lastSlash) : '';
  }

  private static summarizeSignal(signal: PreferenceSignal): string {
    const diffs = signal.context.diffs
      .map(d => `${d.field}: ${d.before} → ${d.after}`)
      .join('; ');
    return `[${signal.action}] ${signal.context.targetPath}: ${diffs}`;
  }

  private static buildFewShotInput(signal: PreferenceSignal): string {
    const path = signal.context.targetPath;
    const diffs = signal.context.diffs
      .map(d => `${d.field}: ${d.before}`)
      .join(', ');
    return `Note "${path}" — current: ${diffs}`;
  }

  private static buildFewShotOutput(signal: PreferenceSignal): string {
    const diffs = signal.context.diffs
      .map(d => `${d.field}: ${d.after}`)
      .join(', ');
    return `Suggestion: ${diffs} (${signal.action})`;
  }
}
