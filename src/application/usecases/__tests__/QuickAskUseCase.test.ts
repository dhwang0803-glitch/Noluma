import { describe, it, expect, vi } from 'vitest';
import { QuickAskUseCase } from '../QuickAskUseCase';
import { SaveNoteUseCase } from '../SaveNoteUseCase';
import { createMockVault, createMockAI, createMockSearch, createMockHistory, createMockConfig, createMockClock } from '../../../test-utils/mock-ports';
import { createTestNote, createTestMetadata, createTestChunk } from '../../../test-utils/fixtures';
import type { NotePath } from '../../../domain/values/NotePath';
import type { TagName } from '../../../domain/values/TagName';
import type { NoteTitle } from '../../../domain/values/NoteTitle';
import type { SearchResult } from '../../ports/SearchIndexPort';
import type { ChunkText } from '../../../domain/values/ChunkText';
import type { HeadingPath } from '../../../domain/values/HeadingPath';

function np(path: string): NotePath {
  return path as unknown as NotePath;
}

function makeSearchResult(notePath: string, text: string): SearchResult {
  return {
    notePath: np(notePath),
    chunk: {
      headingPath: 'h' as unknown as HeadingPath,
      text: text as unknown as ChunkText,
      startLine: 0,
      endLine: 1,
    },
    score: 0.9,
  };
}

describe('QuickAskUseCase', () => {
  function createUseCase(overrides?: {
    vault?: ReturnType<typeof createMockVault>;
    ai?: ReturnType<typeof createMockAI>;
    search?: ReturnType<typeof createMockSearch>;
    config?: ReturnType<typeof createMockConfig>;
  }) {
    const vault = overrides?.vault ?? createMockVault();
    const config = overrides?.config ?? createMockConfig();
    const clock = createMockClock();
    const saveNote = new SaveNoteUseCase(vault, config, clock);

    return new QuickAskUseCase(
      overrides?.ai ?? createMockAI(),
      vault,
      overrides?.search ?? createMockSearch(),
      createMockHistory(),
      config,
      clock,
      saveNote,
    );
  }

  describe('extractLinkSuggestions (via execute)', () => {
    it('AI 응답에서 [[wikilink]]를 추출한다', async () => {
      const ai = createMockAI({
        callCompletion: vi.fn().mockResolvedValue({
          content: '참고: [[TypeScript]] 기초와 [[React Hooks]]를 보세요.',
          tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30, estimatedCostUsd: 0.001 },
          finishReason: 'stop' as const,
        }),
      });
      const vault = createMockVault();

      const uc = createUseCase({ ai, vault });
      const result = await uc.execute({
        question: 'test',
        maxContextChunks: 5,
        saveTarget: { kind: 'new-note', title: 'Q' as unknown as NoteTitle },
        autoTag: false,
        autoLink: true,
      });

      const linkStrings = result.suggestedLinks.map(l => l as string);
      expect(linkStrings).toContain('TypeScript');
      expect(linkStrings).toContain('React Hooks');
    });

    it('[[link|alias]] 형식에서 링크 대상만 추출한다', async () => {
      const ai = createMockAI({
        callCompletion: vi.fn().mockResolvedValue({
          content: '[[Note Name|표시 텍스트]]를 참조',
          tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30, estimatedCostUsd: 0.001 },
          finishReason: 'stop' as const,
        }),
      });

      const uc = createUseCase({ ai });
      const result = await uc.execute({
        question: 'test',
        maxContextChunks: 5,
        saveTarget: { kind: 'new-note', title: 'Q' as unknown as NoteTitle },
        autoTag: false,
        autoLink: true,
      });

      expect(result.suggestedLinks.map(l => l as string)).toContain('Note Name');
      expect(result.suggestedLinks.map(l => l as string)).not.toContain('표시 텍스트');
    });

    it('중복 링크를 제거한다', async () => {
      const ai = createMockAI({
        callCompletion: vi.fn().mockResolvedValue({
          content: '[[Same]] and [[Same]] again',
          tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30, estimatedCostUsd: 0.001 },
          finishReason: 'stop' as const,
        }),
      });

      const uc = createUseCase({ ai });
      const result = await uc.execute({
        question: 'test',
        maxContextChunks: 5,
        saveTarget: { kind: 'new-note', title: 'Q' as unknown as NoteTitle },
        autoTag: false,
        autoLink: true,
      });

      expect(result.suggestedLinks).toHaveLength(1);
    });

    it('autoLink=false면 링크를 추출하지 않는다', async () => {
      const ai = createMockAI({
        callCompletion: vi.fn().mockResolvedValue({
          content: '[[SomeLink]] in response',
          tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30, estimatedCostUsd: 0.001 },
          finishReason: 'stop' as const,
        }),
      });

      const uc = createUseCase({ ai });
      const result = await uc.execute({
        question: 'test',
        maxContextChunks: 5,
        saveTarget: { kind: 'new-note', title: 'Q' as unknown as NoteTitle },
        autoTag: false,
        autoLink: false,
      });

      expect(result.suggestedLinks).toHaveLength(0);
    });
  });

  describe('isChunkAllowed (via execute)', () => {
    it('folder-exclude 규칙에 걸리는 청크를 필터링한다', async () => {
      const searchResults: SearchResult[] = [
        makeSearchResult('private/secret.md', 'secret data'),
        makeSearchResult('public/open.md', 'open data'),
      ];
      const search = createMockSearch(searchResults);

      const vault = createMockVault({
        readNote: vi.fn().mockImplementation(async (path: NotePath) => {
          return createTestNote({ path, metadata: createTestMetadata() });
        }),
      });

      const config = createMockConfig({
        privacyRules: [{
          id: '1',
          name: 'private',
          type: 'folder-exclude',
          pattern: 'private/',
          enabled: true,
        }],
      });

      const uc = createUseCase({ vault, search, config });
      const result = await uc.execute({
        question: 'test',
        maxContextChunks: 10,
        saveTarget: { kind: 'new-note', title: 'Q' as unknown as NoteTitle },
        autoTag: false,
        autoLink: false,
      });

      // private/secret.md의 청크는 필터링, public/open.md만 사용
      expect(result.contextChunksUsed).toHaveLength(1);
      expect((result.contextChunksUsed[0].text as string)).toBe('open data');
    });

    it('프라이버시 규칙이 없으면 모든 청크를 사용한다', async () => {
      const searchResults: SearchResult[] = [
        makeSearchResult('a.md', 'chunk A'),
        makeSearchResult('b.md', 'chunk B'),
      ];
      const search = createMockSearch(searchResults);
      const vault = createMockVault({
        readNote: vi.fn().mockResolvedValue(
          createTestNote({ metadata: createTestMetadata() }),
        ),
      });

      const uc = createUseCase({ vault, search });
      const result = await uc.execute({
        question: 'test',
        maxContextChunks: 10,
        saveTarget: { kind: 'new-note', title: 'Q' as unknown as NoteTitle },
        autoTag: false,
        autoLink: false,
      });

      expect(result.contextChunksUsed).toHaveLength(2);
    });
  });

  describe('execute (전체 파이프라인)', () => {
    it('질문 → 검색 → AI → 저장 → 이력 전체 흐름을 실행한다', async () => {
      const vault = createMockVault({
        readNote: vi.fn().mockResolvedValue(createTestNote({ metadata: createTestMetadata() })),
      });
      const search = createMockSearch([makeSearchResult('ctx.md', 'context')]);
      const history = createMockHistory();
      const config = createMockConfig();
      const clock = createMockClock();
      const saveNote = new SaveNoteUseCase(vault, config, clock);

      const uc = new QuickAskUseCase(
        createMockAI(),
        vault,
        search,
        history,
        config,
        clock,
        saveNote,
      );

      const result = await uc.execute({
        question: 'TypeScript란?',
        maxContextChunks: 5,
        saveTarget: { kind: 'new-note', title: 'Q-TypeScript' as unknown as NoteTitle },
        autoTag: false,
        autoLink: false,
      });

      expect(result.question).toBe('TypeScript란?');
      expect(result.answer).toBeTruthy();
      expect(result.savedTo).toBeTruthy();
      expect(result.tokenUsage).toBeDefined();
      expect(history.record).toHaveBeenCalledTimes(1);
    });
  });
});
