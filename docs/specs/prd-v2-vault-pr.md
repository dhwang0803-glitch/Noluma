# Vaultend v2 PRD — Vault PR & Refactor Engine

- **제품명**: Vaultend Pro — Vault Refactor & Autopilot
- **형태**: Obsidian Community Plugin (Desktop + iOS + Android)
- **작성일**: 2026-07-17
- **상태**: Draft
- **선행 문서**: `docs/specs/prd.md` (v1 PRD)

---

## 1. 제품 재정의

> **Vaultend는 노트를 대신 써주는 AI가 아니라, 당신의 Vault를 안전하게 리팩터링하는 AI 유지보수 엔지니어다.**

v1의 포지션 "정리 엔진"에서 **"Vault용 Dependabot"**으로 진화한다. 문제 목록을 보여주는 데 그치지 않고, 정기적으로 Vault를 분석하여 안전한 변경 제안서(Vault PR)를 생성한다. 사용자는 제안을 검토·승인·거절하고, 한 번에 적용하거나 롤백한다.

### v1 → v2 포지션 전환

| | v1 (현재) | v2 (목표) |
|---|---|---|
| 핵심 가치 | 문제 탐지 + 개별 액션 | 문제 + 해결책을 묶은 변경 제안서 |
| 사용자 행동 | 문제별로 버튼 클릭 | 제안서 검토 → 일괄 승인/적용 |
| 비유 | Linter (경고만 표시) | Dependabot (PR을 만들어줌) |
| 유료 가치 | 자동화 편의 | 수년간 엉킨 Vault를 안전하게 개선 |

---

## 2. 핵심 원칙

v1 원칙을 유지하면서 3개를 추가한다.

1. ~~Maintenance Engine, not Chat App~~ → **Refactor Engine, not Chat App**
2. **Hybrid AI** — 규칙 기반(오프라인) + AI API(온디맨드). 사용자가 비용을 통제
3. **Never modify without consent** — Vault PR 승인 없이 자동 수정 금지
4. **Change history for everything** — 모든 변경에 트랜잭션 이력 유지
5. **Offline-first** — 네트워크 없이도 규칙 기반 탐지 동작
6. **Cost transparency** — AI 호출 비용을 사전 추정하고 표시
7. **(신규) Proposal, not Action** — 실행이 아닌 제안이 기본. 사용자가 승인해야 실행
8. **(신규) Transaction Safety** — 여러 파일 변경을 하나의 트랜잭션으로 묶고 전체 롤백 가능
9. **(신규) Learn from User** — 사용자의 승인/거절 패턴을 축적하여 제안 정확도를 높임

---

## 3. 경쟁 분석 (2026-07 기준)

### 기존 경쟁 환경

| 플러그인 | 포지션 | 가격 | 다운로드 |
|---|---|---|---|
| Smart Connections | 시맨틱 검색 + 관련 노트 연결 | $30/월, $299/년 | 500k+ |
| Copilot | Vault 전체 RAG 채팅 | Free + Plus 유료 | 330k+ |
| Note Companion | 자동 분류 + 음성/유튜브 처리 | BYOK 무료 | - |
| Steward | AI 슬래시 커맨드 + vault 관리 | BYOK 무료 | 신규 |
| Auto Note Mover | 태그 기반 자동 파일 이동 | 무료 | - |
| Vault Reorganizer | 대량 파일 이동 미리보기 | 무료 | - |
| Tag Wrangler | 배치 태그 관리 | 무료 | - |

### Vaultend v2 차별 포지션

| 경쟁자 | 하는 것 | Vaultend v2가 다른 것 |
|---|---|---|
| Smart Connections | 관련 노트 **발견** | 발견이 아니라 **안전한 구조 변경 실행** |
| Copilot | vault에 **질문** | 질문이 아니라 **구조 개선 제안** |
| Note Companion | 새 노트 **분류** | 새 노트가 아니라 **기존 vault 리팩터링** |
| Auto Note Mover | 규칙 기반 **이동** | 규칙이 아니라 **AI 판단 + 승인 + 학습** |
| Vault Reorganizer | 대량 파일 **이동** | 이동뿐 아니라 **태그·링크·속성 재설계 + 롤백** |

### 커뮤니티 페인포인트 매핑

| 페인포인트 (출처) | 현재 해결책 | Vaultend v2 해결 |
|---|---|---|
| "500개 중 150개가 고아 노트" (Forum) | Find Orphaned Files — 목록만 표시 | Vault PR: 각 고아 노트별 재배치/링크/삭제 제안 |
| "정기 감사를 하고 싶은데 고통스럽다" (Forum) | 없음 | 자동 주간 Vault PR 생성 |
| "수동 정리가 너무 지겹다" (XDA) | Auto Note Mover — 규칙 필요 | AI 판단 + 사용자 학습 Organizer |
| "중복 노트가 여러 폴더에" (XDA) | 없음 | Intelligent Merge — 안전한 통합 문서 생성 |
| "태그가 500개로 늘었다" (Forum) | Tag Wrangler — 수동 병합 | Vault Refactor — 태그 체계 재설계 제안 |
| "유료 AI 플러그인에 저항적" (Reddit) | - | BYOK + 일회성 라이선스 (구독 아님) |

---

## 4. 타겟 사용자 (수정)

| 티어 | 프로필 | 핵심 니즈 | 구매 동기 |
|---|---|---|---|
| **Tier 1** | Obsidian 파워 유저 (1000+ 노트, 개발자/연구자) | "몇 년간 쌓인 vault를 안전하게 정리하고 싶다" | Vault Refactor, Intelligent Merge |
| **Tier 2** | PKM 방법론 실천자 (PARA/Zettelkasten) | "내 분류 기준을 학습해서 자동화해줬으면" | Preference Learning |
| **Tier 3** | 모바일 캡처 중심 지식 노동자 | "inbox에 쌓이는 노트를 자동 정리" | 기본 Organize (Free) |

---

## 5. 비목표 (수정)

| 의도적으로 다루지 않는 것 | 이유 |
|---|---|
| 대화형 AI 채팅 고도화 | Copilot/Smart Connections와 직접 경쟁 회피. Quick Ask는 현재 수준 유지 |
| 음성 전사 / 유튜브 요약 | Note Companion이 강하게 점유. Vaultend 정체성과 무관 |
| 웹 검색 / 외부 데이터 연동 | vault 내부 리팩터링에 집중 |
| 온디바이스 LLM (브라우저 내 추론) | 복잡도/성능 문제. Ollama 등 로컬 서버 방식은 지원 |
| 멀티 디바이스 동기화 | Obsidian Sync에 위임 |
| 자체 클라우드 백엔드 | 로컬 + 직접 API 호출만 |
| AI 모델 파인튜닝 | Few-shot + 로컬 규칙으로 충분 |

---

## 6. 핵심 개념: Vault PR

### 정의

Vault PR은 유지보수 스캔의 결과물이다. 기존의 "문제 목록 + 개별 액션 버튼"을 **"변경 제안서"**로 통합한다.

### 구조

```
Vault PR #42 — 2026-07-17 스캔 결과

═══ 변경 제안 12건 ═══

[1/12] 고아 노트 재배치
  📄 React Hooks 정리.md
  📁 현재: / (루트)  →  제안: Projects/Frontend/
  🏷️ 태그 추가: #react #hooks
  🔗 링크 추가: [[React 학습 로드맵]]
  📊 신뢰도: 92%
  💡 근거: 본문이 React hooks 패턴을 다루며, 기존 React 노트 3개와 유사
  [승인] [수정] [거절]

[2/12] 중복 노트 병합
  📄 ML 기초.md + 머신러닝 입문.md + machine-learning-basics.md
  📊 콘텐츠 유사도: 87%
  📝 통합본 미리보기: [열기]
  💡 근거: TF-IDF 코사인 유사도 0.87, 공통 태그 3개
  [승인] [수정] [거절]

[3/12] 중복 태그 통합
  🏷️ #machine-learning, #머신러닝, #ml → #machine-learning
  📄 영향 노트: 14개
  [승인] [대표 태그 변경] [거절]

[4/12] 깨진 링크 수정
  📄 AI Research.md 내 [[GPT-4 Overview]] → [[GPT-4o Overview]]
  💡 근거: 파일명 변경 이력 감지
  [승인] [거절]

...

═══ 요약 ═══
재배치: 3건 | 병합: 2건 | 태그 정리: 4건 | 링크 수정: 3건
예상 AI 호출: 8회 (~$0.03)

[전체 승인] [선택 적용] [전체 되돌리기]
```

### 각 제안 항목에 포함되는 정보

| 필드 | 설명 | 필수 |
|---|---|---|
| 제안 유형 | 재배치/병합/태그 정리/링크 수정/삭제/MOC 갱신 | O |
| 대상 노트 | 변경 대상 파일 경로 | O |
| 변경 내용 | Before/After diff | O |
| 영향 범위 | 영향받는 백링크, 속성, 태그 | O |
| AI 신뢰도 | 0~100% | O |
| 근거 | AI가 이 제안을 한 이유 (1문장) | O |
| 예상 비용 | 이 제안 실행에 필요한 AI 호출 수 | 병합/재배치만 |

### 신뢰도 기반 제안 수준

| 신뢰도 | 표시 | 기본 동작 |
|---|---|---|
| 80%+ | 녹색 뱃지 | 바로 승인 가능 |
| 50~80% | 노란색 뱃지 + "확인 필요" | 사용자 검토 권장 |
| 50% 미만 | 회색 뱃지 + "수동 검토" | 제안 없이 문제만 표시 (v1과 동일) |

### 트랜잭션 안전성

- 하나의 Vault PR 내 모든 승인된 제안은 **하나의 트랜잭션**으로 적용
- 적용 중 오류 발생 시 **전체 롤백**
- 적용 후에도 Vault PR 단위로 **전체 되돌리기** 가능
- History에 Vault PR ID로 묶여 기록

---

## 7. 신규 기능 상세

### F1: Vault PR (유지보수 진화) — Phase 3a

**목표**: 기존 유지보수 스캔을 Vault PR로 진화시킨다.

#### 현재 → 변경

| 현재 (v1) | Vault PR (v2) |
|---|---|
| `MaintenanceResultView` — 문제 목록 | `VaultPRView` — 변경 제안서 |
| 고아 노트: "Archive로 이동" 버튼 | 고아 노트: AI가 적절한 폴더 + 태그 + 링크 제안 |
| 중복 노트: "유사도 N%" 표시 | 중복 노트: 통합 문서 미리보기 + 병합 제안 |
| 깨진 링크: "삭제" 버튼 | 깨진 링크: 대상 추론 + 수정 제안 |
| 중복 태그: "Merge" 버튼 | 중복 태그: 대표 태그 선정 + 일괄 치환 제안 |
| 개별 Undo | 트랜잭션 단위 전체 롤백 |

#### 고아 노트 처리 플로우 (1터치)

```
유지보수 스캔
  → 고아 노트 탐지
  → 각 고아 노트에 대해 OrganizeNote 분석 (dryRun)
    → 콘텐츠 분석 → 폴더/태그/링크 제안 생성
    → 신뢰도 산출
  → Vault PR에 "재배치 제안"으로 포함
  → 사용자가 Vault PR 뷰에서 승인/수정/거절
  → 승인 시 일괄 적용
```

Archive 경유 없이 원본 위치 + 콘텐츠 + vault 구조를 동시에 분석하여 직접 제안한다.

#### 깨진 링크 자동 추론

```
깨진 링크 탐지
  → 파일 이름 변경 이력 확인 (History)
  → 유사 파일명 검색 (Levenshtein ≤ 3)
  → BM25/임베딩으로 콘텐츠 유사도 검색
  → 최적 대상 선정 + 신뢰도 산출
  → Vault PR에 "링크 수정 제안"으로 포함
```

#### 주간 자동 스캔 (Pro)

- 설정 가능한 주기 (매일/매주/매월)
- 스캔 완료 시 Obsidian Notice: "Vault PR #42 생성됨 — 12건의 제안"
- 사용자가 열어서 검토하기 전까지 자동 적용 없음

#### 기술 요구사항

- `VaultPR` 도메인 모델: id, timestamp, proposals[], status(draft/applied/rolledBack)
- `VaultPRProposal` 모델: type, target, before, after, confidence, rationale, status(pending/approved/rejected/applied)
- `ApplyVaultPRUseCase`: 승인된 제안들을 트랜잭션으로 적용
- `RollbackVaultPRUseCase`: 적용된 Vault PR을 전체 롤백
- `VaultPRView`: MaintenanceResultView를 대체하는 새 뷰

---

### F2: Vault Refactor — Phase 3b

**목표**: 사용자가 목표를 선택하면 Vault 전체의 구조 개선 계획을 생성한다.

#### 지원 목표 (Refactor Goals)

| 목표 | 설명 | 분석 범위 |
|---|---|---|
| 태그 체계 정리 | 태그 N개 → M개 이하로 통합 | 전체 태그 + 사용 빈도 + 의미 유사도 |
| PARA 구조 전환 | Projects/Areas/Resources/Archives 폴더 구조 | 전체 노트 메타데이터 + 콘텐츠 |
| 링크 중심 전환 | 폴더 의존도 줄이고 백링크 중심으로 | 폴더 구조 + 링크 그래프 |
| Import 정리 | Notion/Evernote/Bear 가져온 자료 정규화 | 메타데이터 패턴 + 폴더 구조 |
| 프로젝트 분리 | 프로젝트 노트와 참조 자료 분리 | 콘텐츠 분류 + 링크 분석 |

#### 분석 파이프라인 (컨텍스트 한계 대응)

전체 vault를 한번에 AI에 넣을 수 없으므로 다단계 파이프라인으로 처리한다.

```
Phase A — 메타데이터 수집 (오프라인, AI 호출 없음)
  → 전체 노트의 제목, 폴더, 태그, 속성, 링크, 워드 카운트 수집
  → 폴더별/태그별 통계 집계
  → 결과: vault-metadata.json (수천 노트도 수 MB 이내)

Phase B — 청크 분석 (AI 호출, N회)
  → 메타데이터를 50~100개 노트 단위로 청크 분할
  → 각 청크에 대해 AI가 분류/그루핑/태그 매핑 제안
  → 결과: 청크별 부분 계획

Phase C — 종합 계획 (AI 호출, 1~2회)
  → 부분 계획들을 종합
  → 충돌/중복 해소
  → 최종 Refactor Plan 생성

Phase D — Vault PR 생성
  → Refactor Plan을 Vault PR 형태로 변환
  → 각 변경에 Before/After diff + 신뢰도 + 근거 첨부
  → 사용자 검토 → 승인/적용/롤백
```

#### 비용 투명성

Refactor는 AI 호출이 많으므로 실행 전 비용 예측을 보여준다.

```
Vault Refactor: 태그 체계 정리
├── 대상: 1,247개 노트, 483개 태그
├── 예상 AI 호출: 14회 (50개씩 청크 분석 12회 + 종합 2회)
├── 예상 비용: ~$0.15 (GPT-4o 기준)
├── 예상 소요: 2~3분
└── [실행] [취소]
```

#### 기술 요구사항

- `RefactorGoal` 도메인 모델: goalType, parameters(targetTagCount 등), constraints
- `GenerateRefactorPlanUseCase`: 다단계 분석 파이프라인 실행
- `RefactorPlan` 모델: goal, phases[], proposals[], estimatedCost
- Refactor 결과는 Vault PR로 변환하여 기존 VaultPRView에서 표시

---

### F3: Intelligent Merge — Phase 3b

**목표**: 중복 노트를 단순히 탐지하는 것을 넘어 안전한 통합 문서를 생성한다.

#### 현재 → 변경

| 현재 (v1) | Intelligent Merge (v2) |
|---|---|
| "유사도 87%" 표시 | 통합 문서 미리보기 제공 |
| 사용자가 수동으로 병합 | AI가 통합본 생성 + 사용자 승인 |
| 원본 유지 옵션 없음 | 원본 Archive 이동 + 출처 추적 |

#### 병합 분석 구조

유사 노트 N개를 발견하면 AI가 다음을 구분한다:

```
ML 기초.md + 머신러닝 입문.md + machine-learning-basics.md

분석 결과:
├── 공통 내용: 지도학습/비지도학습 정의, 기본 알고리즘 목록
├── 고유 내용:
│   ├── ML 기초.md: 수학적 배경 (선형대수, 확률)
│   ├── 머신러닝 입문.md: Python 코드 예제
│   └── machine-learning-basics.md: 실무 적용 사례
├── 충돌 내용: "최적 학습률" — 0.01 vs 0.001 (두 노트에서 다른 값)
├── 유지할 링크: [[딥러닝 기초]], [[Python 라이브러리]]
└── 유지할 첨부파일: ml-diagram.png
```

#### 병합 실행 프로세스

```
1. 통합본 생성 (AI 호출)
   → 공통 + 고유 내용 합성
   → 충돌 내용은 인라인 표기 (사용자 결정)
   → 모든 링크/첨부파일/속성 보존

2. 미리보기 (Vault PR 내)
   → 통합본 전체 내용
   → Before: 원본 3개 / After: 통합본 1개
   → 영향받는 백링크 목록

3. 승인 시 실행
   → 통합 노트 생성
   → 원본 노트의 모든 백링크를 통합 노트로 리다이렉트
   → 원본을 Archive/ 로 이동 (삭제하지 않음)
   → 통합 노트에 출처 블록 삽입:
     > [!info] 병합 출처
     > 이 노트는 다음 노트들을 통합하여 생성되었습니다:
     > - [[Archive/ML 기초]] (2024-03-15)
     > - [[Archive/머신러닝 입문]] (2024-06-22)
     > - [[Archive/machine-learning-basics]] (2025-01-10)

4. 전체 Undo 가능
   → 통합 노트 삭제
   → 원본 복원 (Archive → 원래 위치)
   → 백링크 원복
```

#### 기술 요구사항

- `MergeAnalysis` 도메인 모델: commonContent, uniqueContent[], conflicts[], links[], attachments[]
- `GenerateMergeProposalUseCase`: 유사 노트 분석 + 통합본 생성
- 통합본 생성은 AI 호출 1회 (원본 노트들의 전문을 컨텍스트로 전달)
- 결과는 Vault PR의 "병합 제안" 유형으로 포함

---

### F4: Preference Learning Organizer — Phase 4

**목표**: 사용자의 승인/거절 패턴을 학습하여 제안 정확도를 점진적으로 높인다.

#### 학습 대상

| 사용자 행동 | 학습 내용 | 저장 형태 |
|---|---|---|
| Organize 결과에서 태그를 수정 | 태그 선호도 (예: #AI → #artificial-intelligence) | 태그 매핑 규칙 |
| 이동 폴더를 변경 | 폴더 분류 기준 | 폴더 라우팅 규칙 |
| 특정 유형의 제안을 반복 거절 | 부정 패턴 (예: 새 폴더 생성 제안 거절) | 제외 규칙 |
| 속성 필드를 수동 추가 | 속성 템플릿 (예: 논문에는 항상 source, authors) | 노트 유형별 속성 규칙 |
| Vault PR 제안을 수정 후 승인 | 수정 패턴 | Few-shot 예시 |

#### 규칙 저장 구조

```json
// .vaultend/preferences.json
{
  "version": 1,
  "tagMappings": [
    { "from": "AI", "to": "artificial-intelligence", "confidence": 0.95, "samples": 18 }
  ],
  "folderRouting": [
    { "pattern": "회의|meeting|미팅", "folder": "Work/Meetings", "confidence": 0.88, "samples": 12 }
  ],
  "exclusions": [
    { "type": "folder-creation", "reason": "사용자가 5회 연속 거절", "samples": 5 }
  ],
  "propertyTemplates": [
    { "noteType": "paper", "properties": ["source", "authors", "year"], "confidence": 0.90, "samples": 8 }
  ],
  "fewShotExamples": [
    {
      "input": { "title": "2024-03-15 팀 회의", "content": "..." },
      "approved": { "folder": "Work/Meetings", "tags": ["meeting", "team"] },
      "rejected": { "folder": "Daily", "tags": ["daily-note"] }
    }
  ]
}
```

#### AI 프롬프트 주입 방식

파인튜닝 없이, 기존 Organize/Vault PR AI 호출에 few-shot 예시를 주입한다.

```
[시스템 프롬프트에 추가]
사용자의 분류 선호도:
- #AI 대신 항상 #artificial-intelligence 사용 (18회 확인)
- 회의 노트는 항상 Work/Meetings/ 로 이동 (12회 확인)
- 새 폴더 생성 제안을 선호하지 않음 (5회 거절)

최근 승인 예시:
- "2024-03-15 팀 회의" → Work/Meetings/, #meeting #team (승인)
- "React Hooks 정리" → Projects/Frontend/, #react #hooks (승인)
```

#### 투명성

```
이 노트를 Research/Papers 로 분류했습니다.
근거: 최근 18번의 승인 패턴 기반 (유사 노트 5개가 같은 폴더로 승인됨)
[패턴 보기] [이번만 수정] [규칙 삭제]
```

#### 기술 요구사항

- `PreferenceStore` Port: load(), save(), addApproval(), addRejection(), getRulesForContext()
- `FilePreferenceAdapter`: `.vaultend/preferences.json` 영속화
- `EnrichPromptWithPreferences` 서비스: AI 호출 전 프롬프트에 few-shot 주입
- 규칙 누적 임계값: 같은 패턴 3회 이상 반복 시 규칙으로 등록

---

### F5: Knowledge Integrity Check — Phase 5

**목표**: 노트 내용의 건강 상태를 검사한다. 파일 구조가 아닌 **콘텐츠 품질**에 집중.

#### 검증 범위 (단계적 확장)

**Phase 5a — 검증 가능한 사실 (초기)**

| 검증 유형 | 예시 | 방법 |
|---|---|---|
| 속성 불일치 | status: in-progress인데 완료일이 3개월 전 | 규칙 기반 |
| 날짜 불일치 | "2024년에 출시된 GPT-5" | AI 호출 |
| 존재하지 않는 속성값 | category: research인데 해당 카테고리 없음 | vault 메타데이터 검색 |
| 오래된 정보 플래그 | 6개월+ 미수정 + 참조 多 | 규칙 기반 |

**Phase 5b — 교차 노트 일관성 (후기)**

| 검증 유형 | 예시 | 방법 |
|---|---|---|
| 모순 탐지 | 노트 A: "GPT-4o가 최신", 노트 B: "GPT-5.4가 최신" | 임베딩 유사 노트 쌍 → AI 비교 |
| 표기 불일치 | "OpenAI" vs "Open AI" vs "open-ai" | 정규화 비교 |
| 요약-본문 불일치 | frontmatter summary와 본문 내용이 다름 | AI 호출 |

#### 오탐 제어 원칙

Knowledge Integrity는 **오탐이 많으면 신뢰를 잃는다.** 따라서:

1. Phase 5a(규칙 기반)부터 시작 — 오탐률 < 5% 목표
2. Phase 5b(AI 기반)는 "확인 필요" 수준으로만 표시 — 단정하지 않음
3. 사용자가 "문제 아님"으로 표시한 항목은 같은 유형을 다시 지적하지 않음
4. 모든 지적에 근거와 해당 노트 발췌를 함께 표시

#### Vault PR 통합

Integrity 결과도 Vault PR의 제안 항목으로 포함:

```
[7/12] 콘텐츠 점검
  📄 AI Research.md
  ⚠️ "GPT-4o가 최신 모델"이라고 기술되어 있으나,
     GPT Models.md에서는 "GPT-5.4가 최신"이라고 기록됨.
  💡 제안: 어느 내용을 기준으로 업데이트할지 선택해주세요.
  [A 기준으로 수정] [B 기준으로 수정] [무시]
```

#### 기술 요구사항

- `IntegrityRule` 도메인 모델: ruleType, check(), severity
- `RunIntegrityCheckUseCase`: 규칙 기반 + AI 기반 검증 실행
- Phase 5a 규칙들은 AI 호출 없이 오프라인 실행 가능
- 결과는 Vault PR에 "콘텐츠 점검" 유형으로 포함

---

### F6: Living MOC — Phase 5

**목표**: vault 변화에 맞춰 자동으로 갱신되는 Maps of Content를 제공한다.

#### 동작 방식

```
1. 사용자가 MOC 대상 지정
   → 주제 키워드 또는 폴더 지정
   → 예: "AI Trading" 또는 Projects/AI-Trading/

2. 초기 MOC 생성
   → 임베딩 유사도로 관련 노트 클러스터링
   → AI가 섹션 구조 생성 (개요/핵심 개념/참고 자료/미정리)

3. 갱신 감지 (Change Tracking 연동)
   → dirty set에 새 노트가 추가되면
   → 해당 노트가 기존 MOC 주제와 관련 있는지 임베딩 비교
   → 관련 있으면 "MOC 업데이트 제안" 생성

4. MOC 업데이트 PR (자동 수정 아님)
   → "AI Trading MOC에 새 노트 2개 추가 제안"
   → 어느 섹션에 넣을지 + 링크 텍스트 제안
   → 사용자 승인 시 MOC 노트 갱신
```

#### MOC 구조 예시

```markdown
# AI Trading MOC

## 핵심 개념
- [[강화학습 기반 트레이딩]] — RL 에이전트 설계
- [[시계열 예측 모델]] — LSTM, Transformer 기반

## 전략
- [[모멘텀 전략 백테스트]] — 2024 결과
- [[페어 트레이딩 알고리즘]] — 통계적 차익거래

## 참고 자료
- [[논문: Deep RL for Trading]] — 2023 논문 요약

## 미연결 (검토 필요)
- [[crypto-sentiment-analysis]] — 🆕 MOC 업데이트 제안
```

#### 기술 요구사항

- `LivingMOC` 도메인 모델: id, topic, sectionStructure[], trackedNotes[], lastUpdated
- `UpdateMOCUseCase`: dirty set 변경 시 관련 MOC 갱신 제안 생성
- MOC 갱신 제안은 Vault PR의 "MOC 갱신" 유형으로 포함
- MOC 메타데이터는 `.vaultend/mocs.json`에 영속화

---

## 8. Free/Pro 구분 (수정)

### 기존 → 변경

| | 기존 (v0.5.15) | 변경 (v2) |
|---|---|---|
| Pro 기능 수 | 4개 | 2 + 4개 (신규) |
| Pro 핵심 가치 | 자동화 편의 | Vault 리팩터링 |
| 가격 | $29 | $29 얼리버드 → $49 정가 |

### 변경되는 기존 Pro 기능

| 기능 | 기존 | 변경 |
|---|---|---|
| `smart-scheduling` | Pro 별도 기능 | Auto Maintenance에 포함 (별도 게이팅 제거) |
| `batch-merge-tags` | Pro | **Free로 전환** (사용자 API를 쓰는데 게이팅은 부당) |

### 새 Free/Pro 구분

**Free**

| 기능 | 설명 |
|---|---|
| Quick Ask (멀티턴 채팅) | vault 컨텍스트 기반 AI Q&A |
| 단일 노트 Organize | 개별 노트 분류/태깅/링크 |
| 수동 Vault Scan | 고아/중복/깨진 링크/중복 태그 탐지 |
| 기본 Vault PR | 스캔 결과를 변경 제안서로 표시 (탐지 + 제안) |
| 중복 태그 병합 | 개별 + 일괄 (제한 없음) |
| 개인정보 보호 | 제외 폴더/태그/속성 규칙 |
| 변경 미리보기 + Undo | 모든 변경에 이력 관리 |

**Pro ($29 얼리버드 → $49 정가, 일회성)**

| 기능 | 설명 | Phase |
|---|---|---|
| 폴더 일괄 Organize | 폴더 단위 배치 분류 | 현재 |
| 자동 Vault Scan | 주기적 자동 스캔 + Vault PR 생성 (Smart Scheduling 포함) | 현재 |
| Vault Refactor | 목표 기반 vault 구조 개선 계획 | 3b |
| Intelligent Merge | 중복 노트 안전 통합 | 3b |
| Preference Learning | 사용자 패턴 학습 + 제안 고도화 | 4 |
| Knowledge Integrity | 콘텐츠 품질 검증 | 5 |
| Living MOC | 자동 갱신 Maps of Content | 5 |

### 가격 정당성

| 가치 | Free에서 체험 | Pro에서 완성 |
|---|---|---|
| "내 vault에 뭐가 문제인지 안다" | O (수동 스캔) | — |
| "문제를 안전하게 고쳐준다" | △ (기본 제안) | O (Refactor + Merge + 트랜잭션) |
| "내 스타일을 알아서 맞춰준다" | X | O (Preference Learning) |
| "정기적으로 알아서 관리한다" | X | O (자동 스캔 + Living MOC) |

---

## 9. Phase 로드맵 (수정)

### Phase 1~2: 완료 (현재 v0.5.15)

Quick Ask, Organize Note/Folder, Vault Maintenance, History/Undo, Free/Pro 게이팅, 임베딩 검색.

### Phase 3a: Vault PR + 로컬 LLM 지원 (6~8주)

**목표**: 유지보수를 Vault PR로 진화 + AI Provider 확장. **이 Phase가 v2의 핵심 전환점.**

| 기능 | 설명 |
|---|---|
| Vault PR 모델 + 뷰 | VaultPR, VaultPRProposal 도메인 모델. VaultPRView UI |
| 고아 노트 AI 재배치 제안 | OrganizeNote dryRun 연동, 신뢰도 표시 |
| 깨진 링크 자동 추론 | 파일명 유사도 + 콘텐츠 유사도로 대상 추론 |
| 트랜잭션 적용/롤백 | 복수 제안 일괄 적용, 전체 Undo |
| 주간 자동 스캔 (Pro) | 설정 주기에 따라 Vault PR 자동 생성 |
| **Ollama 지원** | 로컬 LLM (Llama, Mistral 등) — 비용 0, 프라이버시 최대 |
| **DeepSeek 지원** | DeepSeek API — 저비용 대안 |
| **OpenAI-compatible 엔드포인트** | 커스텀 base URL 지원 (LM Studio, vLLM 등) |

**검증 기준**:
- 수동 스캔 → Vault PR 뷰에 제안서 표시
- 개별/전체 승인 → 일괄 적용
- 적용 후 전체 롤백 → 원상 복구 확인
- 2,000노트 vault 스캔 + 제안 생성 60초 이내

### Phase 3b: Vault Refactor + Intelligent Merge (8~10주)

| 기능 | 설명 |
|---|---|
| Vault Refactor UI | 목표 선택 → 비용 예측 → 실행 → Vault PR 생성 |
| 다단계 분석 파이프라인 | 메타데이터 수집 → 청크 분석 → 종합 계획 |
| Intelligent Merge | 중복 노트 → 통합본 생성 → 미리보기 → 병합 실행 |
| 비용 예측 UI | AI 호출 횟수, 예상 비용, 소요 시간 표시 |

### Phase 4: Preference Learning (4~6주)

| 기능 | 설명 |
|---|---|
| 승인/거절 이력 수집 | Organize + Vault PR 결과에서 패턴 추출 |
| 규칙 저장소 | `.vaultend/preferences.json` 영속화 |
| AI 프롬프트 주입 | Few-shot 예시 + 규칙을 AI 호출에 자동 포함 |
| 투명성 UI | "18번의 패턴 기반" 표시, 규칙 관리 화면 |

### Phase 5: Knowledge Integrity + Living MOC (6~8주)

| 기능 | 설명 |
|---|---|
| 규칙 기반 Integrity (5a) | 속성 불일치, 오래된 정보, 존재하지 않는 값 |
| AI 기반 Integrity (5b) | 모순 탐지, 표기 불일치 |
| Living MOC 생성 | 주제별 MOC 자동 생성 + 섹션 구조 |
| MOC 갱신 제안 | 새 노트 추가 시 관련 MOC 업데이트 PR |

---

## 10. 기술 아키텍처 확장

### 신규 도메인 모델

| 모델 | 위치 | 설명 |
|---|---|---|
| `VaultPR` | `domain/models/` | id, timestamp, proposals[], status |
| `VaultPRProposal` | `domain/models/` | type, target, before, after, confidence, rationale, status |
| `RefactorGoal` | `domain/models/` | goalType, parameters, constraints |
| `RefactorPlan` | `domain/models/` | goal, phases[], proposals[], estimatedCost |
| `MergeAnalysis` | `domain/models/` | commonContent, uniqueContent[], conflicts[] |
| `IntegrityRule` | `domain/models/` | ruleType, check(), severity |
| `LivingMOC` | `domain/models/` | id, topic, sections[], trackedNotes[] |

### 신규 Port

| Port | 위치 | 설명 |
|---|---|---|
| `VaultPRPort` | `application/ports/` | Vault PR CRUD + 제안 상태 관리 |
| `PreferencePort` | `application/ports/` | 사용자 선호도 규칙 저장/조회 |

### 신규 UseCase

| UseCase | 위치 | 설명 |
|---|---|---|
| `GenerateVaultPRUseCase` | `application/usecases/` | 스캔 결과 → Vault PR 생성 |
| `ApplyVaultPRUseCase` | `application/usecases/` | 승인된 제안 트랜잭션 적용 |
| `RollbackVaultPRUseCase` | `application/usecases/` | Vault PR 전체 롤백 |
| `GenerateRefactorPlanUseCase` | `application/usecases/` | 다단계 Refactor 분석 |
| `GenerateMergeProposalUseCase` | `application/usecases/` | 중복 노트 통합본 생성 |
| `RunIntegrityCheckUseCase` | `application/usecases/` | 콘텐츠 무결성 검증 |
| `UpdateMOCUseCase` | `application/usecases/` | Living MOC 갱신 제안 |

### 신규 Adapter

| Adapter | 위치 | 설명 |
|---|---|---|
| `FileVaultPRAdapter` | `adapters/vaultpr/` | `.vaultend/vault-prs/` JSON 영속화 |
| `FilePreferenceAdapter` | `adapters/preference/` | `.vaultend/preferences.json` 영속화 |
| `OllamaAdapter` | `adapters/ai/` | Ollama 로컬 API (`localhost:11434`) — completion + embedding |
| `DeepSeekAdapter` | `adapters/ai/` | DeepSeek API — OpenAI-compatible 프로토콜 |

### AI Provider 확장 (Phase 3a)

기존 Strategy 패턴(`DynamicAIAdapter`)을 확장하여 신규 Provider를 추가한다.

| Provider | Adapter | Chat 모델 | Embedding 모델 | 비용 |
|---|---|---|---|---|
| `openai` | `OpenAIAdapter` | gpt-4o | text-embedding-3-small | BYOK |
| `gemini` | `GeminiAdapter` | 설정에 따라 | text-embedding-004 | BYOK |
| `ollama` | `OllamaAdapter` | llama3.2, mistral 등 | nomic-embed-text 등 | 무료 (로컬) |
| `deepseek` | `DeepSeekAdapter` | deepseek-chat | — (임베딩 미지원 시 fallback) | BYOK (저비용) |
| `custom` | `OpenAICompatAdapter` | 사용자 지정 | 사용자 지정 | 사용자 지정 |

**구현 원칙**:
- Ollama/DeepSeek 모두 `AIProviderPort` 인터페이스를 구현 — UseCase 변경 없음
- `custom` 모드: base URL + 모델명만 입력하면 OpenAI-compatible 엔드포인트에 연결 (LM Studio, vLLM, text-generation-webui 등)
- Ollama는 `requestUrl()` 대신 `localhost` 직접 호출 — 모바일에서는 사용 불가 (Desktop only)
- 임베딩 미지원 Provider는 BM25 단독 검색으로 자동 fallback

### Clean Architecture 준수

- 모든 신규 모델은 `domain/`에 위치 — 외부 의존 없음
- UseCase는 Port 인터페이스만 참조 — 구체 Adapter 직접 import 금지
- Vault PR 생성/적용/롤백은 UseCase로 분리 — 단일 책임
- UI(VaultPRView)는 main.ts에서 UseCase를 주입받아 사용

---

## 11. 성공 지표

| 지표 | 목표 | 측정 방법 |
|---|---|---|
| Vault PR 승인률 | > 70% | 승인된 제안 / 전체 제안 |
| Preference Learning 정확도 향상 | 사용자 수정 비율 월 5%p 감소 | 승인 시 수정 없이 승인된 비율 |
| Pro 전환율 | > 5% (활성 사용자 중) | Free → Pro 전환 수 |
| 커뮤니티 별점 | > 4.5/5 | Obsidian Community Plugin 리뷰 |
| 중복 노트 병합 완료율 | > 80% | 제안된 병합 중 실행된 비율 |

---

## 12. 위험 요소

| 위험 | 심각도 | 완화 방안 |
|---|---|---|
| AI 제안 오분류로 사용자 신뢰 하락 | 높음 | 신뢰도 기반 3단계 표시, 낮은 건 제안 생략 |
| Vault Refactor의 대규모 AI 비용 | 중간 | 사전 비용 예측 필수 표시, 청크 크기 최적화 |
| Intelligent Merge의 콘텐츠 손실 | 높음 | 원본 절대 삭제 안 함 (Archive), 전체 롤백 보장 |
| Knowledge Integrity 오탐으로 짜증 유발 | 높음 | Phase 5a(규칙 기반)부터 시작, "문제 아님" 학습 |
| Preference Learning 규칙 충돌 | 낮음 | 최신 패턴 우선, 규칙 관리 UI 제공 |
| Obsidian 커뮤니티 유료 저항 | 중간 | Free 코어 충분히 강하게, 일회성 가격, BYOK 유지 |

---

## 갱신 이력

| 날짜 | 내용 |
|---|---|
| 2026-07-06 | v1 PRD 초기 작성 |
| 2026-07-17 | v2 PRD 작성 — Vault PR 개념 도입, 5개 신규 기능, Free/Pro 재설계 |
