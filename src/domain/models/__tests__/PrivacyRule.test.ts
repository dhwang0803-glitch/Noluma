import { describe, it, expect } from 'vitest';
import { isNoteAllowedByRules, PrivacyRule } from '../PrivacyRule';

function makeRule(overrides: Partial<PrivacyRule> & { type: PrivacyRule['type']; pattern: string }): PrivacyRule {
  return {
    id: 'rule-1',
    name: 'Test Rule',
    enabled: true,
    ...overrides,
  };
}

describe('isNoteAllowedByRules', () => {
  describe('규칙이 없을 때', () => {
    it('규칙 배열이 비어있으면 true를 반환한다', () => {
      expect(isNoteAllowedByRules('folder/note.md', [], [], [])).toBe(true);
    });
  });

  describe('folder-exclude', () => {
    const rule = makeRule({ type: 'folder-exclude', pattern: 'private/' });

    it('패턴으로 시작하는 경로를 차단한다', () => {
      expect(isNoteAllowedByRules('private/secret.md', [], [], [rule])).toBe(false);
    });

    it('중첩 폴더도 차단한다', () => {
      expect(isNoteAllowedByRules('private/sub/deep.md', [], [], [rule])).toBe(false);
    });

    it('패턴과 무관한 경로는 허용한다', () => {
      expect(isNoteAllowedByRules('public/note.md', [], [], [rule])).toBe(true);
    });

    it('경로 중간에 포함된 패턴은 차단하지 않는다', () => {
      expect(isNoteAllowedByRules('docs/private/note.md', [], [], [rule])).toBe(true);
    });
  });

  describe('tag-exclude', () => {
    const rule = makeRule({ type: 'tag-exclude', pattern: '#secret' });

    it('정확히 일치하는 태그를 차단한다', () => {
      expect(isNoteAllowedByRules('note.md', ['#secret'], [], [rule])).toBe(false);
    });

    it('다른 태그만 있으면 허용한다', () => {
      expect(isNoteAllowedByRules('note.md', ['#public', '#work'], [], [rule])).toBe(true);
    });

    it('태그가 없으면 허용한다', () => {
      expect(isNoteAllowedByRules('note.md', [], [], [rule])).toBe(true);
    });

    it('부분 매칭은 차단하지 않는다', () => {
      expect(isNoteAllowedByRules('note.md', ['#secret-project'], [], [rule])).toBe(true);
    });
  });

  describe('frontmatter-exclude', () => {
    const rule = makeRule({ type: 'frontmatter-exclude', pattern: 'classified' });

    it('frontmatter 키가 있으면 차단한다', () => {
      expect(isNoteAllowedByRules('note.md', [], ['classified', 'tags'], [rule])).toBe(false);
    });

    it('frontmatter 키가 없으면 허용한다', () => {
      expect(isNoteAllowedByRules('note.md', [], ['tags', 'date'], [rule])).toBe(true);
    });

    it('빈 frontmatter이면 허용한다', () => {
      expect(isNoteAllowedByRules('note.md', [], [], [rule])).toBe(true);
    });
  });

  describe('content-redact', () => {
    const rule = makeRule({ type: 'content-redact', pattern: 'password:.*' });

    it('노트 접근 자체는 차단하지 않는다 (전송 시점 처리)', () => {
      expect(isNoteAllowedByRules('note.md', [], [], [rule])).toBe(true);
    });
  });

  describe('disabled 규칙', () => {
    it('비활성화된 규칙은 무시한다', () => {
      const rule = makeRule({ type: 'folder-exclude', pattern: 'private/', enabled: false });
      expect(isNoteAllowedByRules('private/note.md', [], [], [rule])).toBe(true);
    });
  });

  describe('복합 규칙', () => {
    const rules: PrivacyRule[] = [
      makeRule({ id: '1', type: 'folder-exclude', pattern: 'private/' }),
      makeRule({ id: '2', type: 'tag-exclude', pattern: '#confidential' }),
      makeRule({ id: '3', type: 'frontmatter-exclude', pattern: 'secret' }),
    ];

    it('첫 번째 규칙에 걸리면 즉시 false', () => {
      expect(isNoteAllowedByRules('private/note.md', [], [], rules)).toBe(false);
    });

    it('두 번째 규칙에 걸려도 false', () => {
      expect(isNoteAllowedByRules('public/note.md', ['#confidential'], [], rules)).toBe(false);
    });

    it('세 번째 규칙에 걸려도 false', () => {
      expect(isNoteAllowedByRules('public/note.md', [], ['secret'], rules)).toBe(false);
    });

    it('모든 규칙을 통과하면 true', () => {
      expect(isNoteAllowedByRules('public/note.md', ['#work'], ['tags'], rules)).toBe(true);
    });
  });
});
