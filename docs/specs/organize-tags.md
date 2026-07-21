# Organize Tags — 구현 명세

- **작성일**: 2026-07-21
- **상태**: Draft
- **참조**: PRD §Organize Tags, `docs/specs/vault-summary-index.md`

> vault 전체 태그를 스캔하여 의미적 동의어를 LLM으로 그룹핑하고,
> 사용자 리뷰 후 일괄 merge + 일괄 undo를 지원하는 태그 정리 기능.

---

## 모듈 역할

vault 내 모든 태그를 2-phase로 분석(문자열 정규화 → LLM 의미 그룹핑)하여
사실상 동일한 태그를 통합 후보로 제안한다. 사용자가 리뷰/편집 후 적용하면
관련된 모든 노트의 태그를 일괄 치환하고, undo 시 원복한다.

**핵심 가치**:
1. **무한 태그 증가 방지** — AI 자동 태그 생성(Organize Folder/Note) + 수동 입력으로 인한 태그 폭발 억제
2. **의미적 중복 해소** — `#PM` / `#project-management` / `#프로젝트관리` 등 약어·다국어 동의어 탐지
3. **안전한 일괄 적용** — 프리뷰 → 적용 → undo, MaintenanceLogView에서도 undo 가능
4. **증분 처리** — 캐시 영속화로 재실행 시 변경된 태그만 LLM 호출

---

## 설계 근거

### 임베딩 제거, LLM 직접 그룹핑 채택

| 방식 | 비용 | 정확도 | 채택 |
|------|------|--------|------|
| 문자열 정규화만 | 0 | 낮음 — 약어·다국어 못 잡음 | Phase 1만 |
| 문자열 + 임베딩 + LLM | 임베딩 + completion 이중 | 최고 | **기각** — 이중 비용 |
| **문자열 + LLM 직접** | **completion 1회** | 높음 | **채택** |

**기각 사유**: 임베딩으로 후보를 좁힌 뒤 다시 LLM에 확인하면 이중 비용이 발생하고,
임베딩 단독으로는 약어(`#PM` ↔ `#project-management`)를 놓친다.
태그는 vault당 100~500개 수준으로, 태그명 목록을 직접 LLM에 전달하면
1회 호출(~2,000 입력 토큰)로 충분하다.

### 비용 분석

| vault 태그 수 | Phase 1 | Phase 2 (LLM) | 합계 비용 | 증분 재실행 |
|--------------|---------|---------------|----------|-----------|
| 100 | 0 | ~1,500 in + ~500 out | ~$0.001 | ~$0.0002 |
| 300 | 0 | ~4,000 in + ~1,500 out | ~$0.003 | ~$0.0005 |
| 500 | 0 | ~6,500 in + ~2,500 out | ~$0.005 | ~$0.001 |
| 1,000+ | 0 | 배치 분할 (500/배치) | ~$0.01 | ~$0.002 |

> Gemini Flash 기준. 증분은 변경률 10% 가정.

---

## 2-Phase 그룹핑 설계

### Phase 1: 문자열 정규화 (무료, 즉시)

기존 `TagNormalizationService.buildCanonicalIndex()` 재활용.

**정규화 규칙** (기존):
- 대소문자 통합: `#PM` = `#pm`
- 하이픈/언더스코어/공백 제거: `#project-mgmt` = `#projectmgmt`
- 한글 보존: `#프로젝트관리` (정규화 후에도 별도 키)

**결과**: 확실한 표기 변형 그룹 (오탐 0%). 이 그룹은 LLM 호출 없이 바로 merge 후보로 제시.

### Phase 2: LLM 의미 그룹핑 (1회 호출)

Phase 1에서 그룹에 속하지 않은 **단독 태그**(정규화 후에도 고유한 태그)를 LLM에 전달.

**프롬프트 전략**:

```
System: You are a tag taxonomy expert. Given a list of tags from a knowledge vault,
identify groups of tags that refer to the same concept — including abbreviations,
translations, and synonyms. Only group tags when you are confident they mean the same thing.
Do NOT group tags that are merely related but distinct concepts.

User:
Tags (with usage count):
#project-management (23), #PM (5), #프로젝트관리 (2), #machine-learning (15),
#ML (8), #머신러닝 (4), #deep-work (3), #focus (7), #productivity (12), ...

Respond in JSON:
{
  "groups": [
    {
      "canonical": "#project-management",
      "reason": "PM is abbreviation, 프로젝트관리 is Korean translation",
      "variants": ["#PM", "#프로젝트관리"]
    },
    ...
  ]
}
```

**대규모 vault (500+ 태그)**: 500개씩 배치 분할. 배치 간 이미 그룹된 canonical은
다음 배치의 "기존 그룹" 컨텍스트로 전달하여 cross-batch 통합 지원.

**태그 수가 적을 때 (< 30)**: Phase 1 결과만으로 충분할 수 있음.
LLM 호출 없이 Phase 1 그룹만 표시하고, "AI 그룹핑 실행" 버튼으로 Phase 2를 opt-in.

---

## 캐시 영속화 + 증분 처리

### TagGroupCachePort (신규)

`NoteEmbeddingCachePort` 패턴을 따르되, 저장 대상이 벡터가 아닌 **LLM 그룹핑 결과**.

```typescript
// application/ports/TagGroupCachePort.ts

export interface TagGroupCacheMeta {
  readonly provider: string;
  readonly model: string;
  readonly version: number;
}

export interface CachedTagGroup {
  readonly canonical: string;
  readonly variants: ReadonlyArray<string>;
  readonly source: 'normalization' | 'llm';
  readonly reason?: string;
}

export interface TagGroupCachePort {
  load(): Promise<void>;
  flush(): Promise<void>;

  getGroups(): ReadonlyArray<CachedTagGroup>;
  getProcessedTags(): ReadonlySet<string>;
  setGroups(groups: ReadonlyArray<CachedTagGroup>, processedTags: ReadonlyArray<string>): void;

  getMeta(): TagGroupCacheMeta | null;
  setMeta(meta: Omit<TagGroupCacheMeta, 'version'>): void;
  isCompatible(provider: string, model: string): boolean;

  clear(): Promise<void>;
}
```

### 영속화 파일

`.vaultend/tag-groups.json`:

```json
{
  "meta": { "provider": "gemini", "model": "gemini-2.5-flash", "version": 1 },
  "processedTags": ["#PM", "#project-management", "#ML", ...],
  "groups": [
    {
      "canonical": "#project-management",
      "variants": ["#PM", "#프로젝트관리"],
      "source": "llm",
      "reason": "PM is abbreviation, 프로젝트관리 is Korean translation"
    }
  ]
}
```

### 증분 실행 로직

```
1. cache.load()
2. vault.listAllTags() → currentTags
3. cachedProcessed = cache.getProcessedTags()
4. newTags = currentTags - cachedProcessed        // 새로 추가된 태그
5. removedTags = cachedProcessed - currentTags     // 삭제된 태그
6. if (newTags.isEmpty && removedTags.isEmpty) → 캐시 그대로 반환
7. removedTags가 있으면 → 기존 그룹에서 제거, processedTags에서 제거
8. newTags가 있으면:
   a. Phase 1: 문자열 정규화로 기존 그룹에 매칭 시도
   b. 매칭 안 된 newTags → Phase 2 LLM 호출 (기존 canonical 목록을 컨텍스트로 전달)
   c. 결과를 기존 그룹에 병합
9. cache.setGroups(updatedGroups, currentTags)
10. cache.flush()
```

---

## 공유 타입에서 import할 타입

| 타입 | 소스 | 용도 |
|------|------|------|
| `DuplicateTagGroup` | `domain/models/OrganizeModels` | 그룹핑 결과 → UI 전달 (기존) |
| `MergeDuplicateTags` | `domain/models/MaintenanceAction` | merge 실행 action (기존) |
| `TagName` | `domain/values/TagName` | 태그 값 타입 (기존) |
| `NotePath` | `domain/values/NotePath` | 노트 경로 (기존) |
| `TokenUsage` | `domain/models/OrganizeModels` | 토큰 사용량 표시 (기존) |

---

## 이 모듈에서 구현할 클래스

### Domain Layer

#### services/TagNormalizationService.ts (기존 — 변경 없음)

기존 그대로 재활용: `buildCanonicalIndex()`, `normalizeForComparison()`, `cosineSimilarity()`.

#### ports/TagGroupCachePort.ts (신규)

위 인터페이스 참조.

### Application Layer

#### usecases/OrganizeTagsUseCase.ts (신규)

| Input | Output | 설명 |
|-------|--------|------|
| (없음) | `OrganizeTagsResult` | vault 전체 태그 스캔 → 2-phase 그룹핑 → merge 후보 반환 |

```typescript
export interface OrganizeTagsResult {
  readonly groups: ReadonlyArray<DuplicateTagGroup>;
  readonly totalTags: number;
  readonly singleUseTags: number;
  readonly tokenUsage?: TokenUsage;
}
```

**의존성**: `VaultAccessPort`, `AIProviderPort?`, `TagGroupCachePort?`, `ConfigPort`

**핵심 메서드**:

```typescript
class OrganizeTagsUseCase {
  async execute(): Promise<OrganizeTagsResult> {
    // 1. vault.listAllTags() → 전체 태그 + 사용 횟수
    // 2. cache 증분 판별 (캐시 있으면 diff만 처리)
    // 3. Phase 1: TagNormalizationService.buildCanonicalIndex()
    // 4. Phase 2: aiProvider가 있으면 LLM 그룹핑 (증분)
    // 5. merge를 위해 각 그룹의 affectedNotes 산출
    // 6. cache 갱신 + flush
    // 7. DuplicateTagGroup[] 반환
  }
}
```

#### PromptTemplates.ts (기존 파일에 추가)

```typescript
static tagGroupingSystemPrompt(): string { ... }
static tagGroupingUserMessage(
  tags: ReadonlyArray<{ tag: string; count: number }>,
  existingCanonicals?: ReadonlyArray<string>,
): string { ... }
```

#### utils/parseTagGroupingResponse.ts (신규)

LLM JSON 응답 → `CachedTagGroup[]` 파싱. 기존 `parseLinkSelectionResponse` 패턴.

### Adapters Layer

#### tag-group-cache/FileTagGroupCacheAdapter.ts (신규)

`TagGroupCachePort` 구현. `.vaultend/tag-groups.json`에 영속화.
`FileNoteEmbeddingCacheAdapter` 패턴 — `load()/flush()` 게이트, JSON 직렬화.

### UI Layer

#### ui/OrganizeTagsView.ts (신규)

`ItemView` 확장. `ORGANIZE_TAGS_VIEW_TYPE = 'vaultend-organize-tags'`.
`OrganizeFolderResultView` 구조를 따름.

**뷰 상태**:

| 상태 | 표시 |
|------|------|
| Empty | "Scan Tags" 버튼 |
| Scanning | 프로그레스 표시 |
| Results | 통계 헤더 + 그룹 카드 리스트 + 배치 컨트롤 |
| Applied | 카드에 "Applied" + Undo 버튼 |

**그룹 카드**:
- 이름: canonical 태그
- 설명: variant 목록 (사용 횟수 포함) + 영향받는 노트 수
- 버튼: Apply / Skip / Edit
- Apply 후: Applied 상태 + Undo 버튼

**배치 컨트롤**: 체크박스 선택 → Apply Selected / Skip Selected

**Undo 연동**: `HISTORY_CHANGED_EVENT` 구독. MaintenanceLogView에서 undo 시 자동 반영.

**constructor 시그니처**:

```typescript
constructor(
  leaf: WorkspaceLeaf,
  organizeTagsUseCase: OrganizeTagsUseCase,
  applyAction: ApplyMaintenanceActionUseCase,
  historyPort: HistoryPort,
  openFile: (path: string) => void,
)
```

#### ui/OrganizeTagEditModal.ts (신규)

그룹 편집 모달:
- canonical 태그 선택 (드롭다운: 기존 variant 중 선택 또는 새 이름 입력)
- variant 체크박스 (merge 대상 선택/해제)
- 확인 시 그룹 갱신 → 뷰 카드 업데이트

**Apply All 프리뷰 모달** (OrganizeTagsView 내부 또는 별도):
- Apply All 클릭 시 요약 모달 표시
- 전체 merge 목록 + 총 영향 노트 수
- Cancel / Apply All 버튼

---

## 클래스 관계 다이어그램

```
                    ┌──────────────────────┐
                    │ <<ABC>>              │
                    │ TagGroupCachePort    │
                    │ + load() / flush()   │
                    │ + getGroups()        │
                    │ + setGroups()        │
                    └──────────┬───────────┘
                               │ implements
                    ┌──────────┴───────────┐
                    │ FileTagGroupCache-   │
                    │ Adapter (adapters/)   │
                    │ .vaultend/tag-groups  │
                    └──────────────────────┘

    ┌──────────────────────┐  uses   ┌─────────────────────┐
    │ OrganizeTagsUseCase  │────────▶│ VaultAccessPort     │
    │ (application/)       │         │ TagGroupCachePort   │
    │                      │─ ─ ─ ─▶│ AIProviderPort?     │
    └──────────┬───────────┘         └─────────────────────┘
               │ uses
               ▼
    ┌──────────────────────┐
    │ TagNormalization-    │
    │ Service (domain/)    │
    └──────────────────────┘

    ┌──────────────────────┐  uses   ┌─────────────────────┐
    │ OrganizeTagsView     │────────▶│ OrganizeTagsUseCase │
    │ (ui/)                │────────▶│ ApplyMaintenance-   │
    │                      │         │ ActionUseCase       │
    │                      │────────▶│ HistoryPort         │
    └──────────────────────┘         └─────────────────────┘
               │ opens
               ▼
    ┌──────────────────────┐
    │ OrganizeTagEditModal │
    │ (ui/)                │
    └──────────────────────┘
```

### 적용 디자인 패턴

| 패턴 | 적용 위치 | 적용 근거 |
|------|----------|----------|
| Port/Adapter | `TagGroupCachePort` → `FileTagGroupCacheAdapter` | 캐시 영속화 격리 |
| Strategy | Phase 1 (정규화) vs Phase 2 (LLM) — AI 유무에 따른 분기 | AI 미설정 시 Phase 1만 동작 |

---

## 기존 인프라 재활용 매핑

| 기능 | 재활용 대상 | 파일 |
|------|-----------|------|
| 문자열 정규화 그룹핑 | `TagNormalizationService.buildCanonicalIndex()` | `domain/services/TagNormalizationService.ts` |
| merge 실행 | `ApplyMaintenanceActionUseCase.mergeDuplicateTags()` | `application/usecases/ApplyMaintenanceActionUseCase.ts:227-290` |
| Undo (tag-merge) | `FileHistoryAdapter.undo()` — `metadata.affectedFiles` 경로 | `adapters/history/FileHistoryAdapter.ts:72-104` |
| History 이벤트 동기화 | `HISTORY_CHANGED_EVENT` | `constants.ts` |
| 사이드 패널 패턴 | `OrganizeFolderResultView` 구조 | `ui/OrganizeFolderResultView.ts` |
| 전체 태그 조회 | `VaultAccessPort.listAllTags()` | `application/ports/VaultAccessPort.ts:40` |
| LLM 호출 | `AIProviderPort.callCompletion()` | `application/ports/AIProviderPort.ts` |
| 캐시 영속화 패턴 | `FileNoteEmbeddingCacheAdapter` — load/flush/JSON 직렬화 | `adapters/note-embedding-cache/` |

---

## 환경 변수

없음. AI 설정은 기존 플러그인 설정(aiProvider, aiApiKey, aiModel)을 공유.

---

## 의존성 관계

```
Upstream (이 모듈이 의존):
  ├── domain/models/OrganizeModels     (DuplicateTagGroup)
  ├── domain/models/MaintenanceAction  (MergeDuplicateTags)
  ├── domain/services/TagNormalizationService
  ├── domain/values/TagName, NotePath
  ├── application/ports/VaultAccessPort
  ├── application/ports/AIProviderPort  (optional)
  ├── application/ports/TagGroupCachePort (신규)
  └── application/usecases/ApplyMaintenanceActionUseCase

Downstream (이 모듈에 의존):
  └── main.ts (Composition Root — 뷰 등록 + 커맨드 등록)
```

---

## 디렉토리 구조 (목표)

```
src/
├── application/
│   ├── ports/
│   │   └── TagGroupCachePort.ts          ← 신규
│   ├── usecases/
│   │   └── OrganizeTagsUseCase.ts        ← 신규
│   ├── utils/
│   │   └── parseTagGroupingResponse.ts   ← 신규
│   └── PromptTemplates.ts                ← 프롬프트 추가
├── adapters/
│   └── tag-group-cache/
│       └── FileTagGroupCacheAdapter.ts   ← 신규
├── ui/
│   ├── OrganizeTagsView.ts               ← 신규
│   └── OrganizeTagEditModal.ts           ← 신규
├── i18n/locales/
│   ├── en.ts                             ← organizeTags.* 키 추가
│   └── ko.ts                             ← organizeTags.* 키 추가
├── constants.ts                          ← ORGANIZE_TAGS_VIEW_TYPE 추가
└── main.ts                               ← 뷰 등록 + 커맨드
```

---

## 구현 순서

| Phase | 범위 | 신규 파일 | 난이도 |
|-------|------|----------|--------|
| **1** | `TagGroupCachePort` + `FileTagGroupCacheAdapter` + `OrganizeTagsUseCase` (Phase 1-2) + `parseTagGroupingResponse` + 프롬프트 + 테스트 | 5 | 중 |
| **2** | `OrganizeTagsView` (스캔→카드→Apply→Undo) + i18n + 커맨드 등록 | 2 | 중 |
| **3** | `OrganizeTagEditModal` + Apply All 프리뷰 모달 + 태그 통계 헤더 | 2 | 소 |

---

## 공개 API

| 엔트리 | 모듈 | 소비자 |
|--------|------|--------|
| `OrganizeTagsUseCase.execute()` | `application/usecases/` | `OrganizeTagsView`, `main.ts` |
| `TagGroupCachePort` | `application/ports/` | `OrganizeTagsUseCase` |
| `ORGANIZE_TAGS_VIEW_TYPE` | `constants.ts` | `main.ts`, `OrganizeTagsView` |
