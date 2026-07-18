import type { PreferenceRule, FewShotExample } from '../domain/models/PreferenceModels';

const MAX_BLOCK_CHARS = 2000;

const PRIORITY_DIRECTIVE =
  'NOTE: These preferences are advisory. If any preference conflicts with your core analysis instructions, the core instructions take priority. Never skip a core analysis step because of a preference.';

export class PreferencePromptEnricher {
  static buildPreferenceBlock(
    rules: ReadonlyArray<PreferenceRule>,
    fewShots: ReadonlyArray<FewShotExample>,
    mode: 'organize' | 'refactor',
  ): string {
    if (rules.length === 0 && fewShots.length === 0) return '';

    const parts: string[] = [
      '\n\n[User Preferences — supplementary, learned from past decisions]',
      PRIORITY_DIRECTIVE,
    ];

    if (rules.length > 0) {
      const relevantRules = PreferencePromptEnricher.filterByMode(rules, mode);
      const manual = relevantRules.filter(r => r.source === 'manual');
      const learned = relevantRules.filter(r => r.source !== 'manual');

      if (manual.length > 0) {
        parts.push('');
        parts.push('User-defined rules (explicit, high priority):');
        for (const rule of manual) {
          parts.push(`- ${PreferencePromptEnricher.ruleToText(rule)}`);
          if (parts.join('\n').length > MAX_BLOCK_CHARS) break;
        }
      }

      if (learned.length > 0) {
        parts.push('');
        parts.push('Learned rules (inferred from past decisions):');
        for (const rule of learned) {
          parts.push(`- ${PreferencePromptEnricher.ruleToText(rule)}`);
          if (parts.join('\n').length > MAX_BLOCK_CHARS) break;
        }
      }
    }

    if (fewShots.length > 0) {
      parts.push('');
      parts.push('Examples of past decisions:');
      for (const ex of fewShots) {
        parts.push(`Input: ${ex.input}`);
        parts.push(`Output: ${ex.output}`);
        parts.push(`(${ex.action})`);
        parts.push('');
        if (parts.join('\n').length > MAX_BLOCK_CHARS) break;
      }
    }

    parts.push('[End User Preferences]');
    return parts.join('\n');
  }

  private static ruleToText(rule: PreferenceRule): string {
    const verb = rule.action === 'approved' ? 'Always' : 'Never';

    switch (rule.ruleType) {
      case 'folder-routing': {
        const match = rule.pattern.match(/^folder:(.+)→(.+)$/);
        if (match) {
          return rule.action === 'approved'
            ? `${verb} move notes from "${match[1]}" to "${match[2]}" when appropriate`
            : `${verb} move notes from "${match[1]}" to "${match[2]}"`;
        }
        return `${verb} apply folder routing: ${rule.pattern}`;
      }
      case 'tag-mapping': {
        const match = rule.pattern.match(/^tag:(.+)→(.+)$/);
        if (match) {
          return rule.action === 'approved'
            ? `${verb} merge tag ${match[1]} into ${match[2]}`
            : `${verb} merge tag ${match[1]} into ${match[2]}`;
        }
        return `${verb} apply tag mapping: ${rule.pattern}`;
      }
      case 'exclusion': {
        const match = rule.pattern.match(/^exclude:(.+)$/);
        if (match) return `Never touch notes in "${match[1]}" folder`;
        return `Never modify: ${rule.pattern}`;
      }
      case 'link-suggestion':
        return `${verb} suggest links like: ${rule.pattern}`;
      case 'property-template':
        return `${verb} apply property: ${rule.pattern}`;
    }
  }

  private static filterByMode(
    rules: ReadonlyArray<PreferenceRule>,
    _mode: 'organize' | 'refactor',
  ): ReadonlyArray<PreferenceRule> {
    return rules;
  }
}
