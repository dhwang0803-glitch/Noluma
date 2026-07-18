# Obsidian 커뮤니티 시장 조사 결과

- **조사일**: 2026-07-17
- **목적**: Vaultend Pro 기능 설계를 위한 커뮤니티 페인포인트 + 경쟁 환경 + 지불 의향 파악
- **조사 범위**: Obsidian Forum, Reddit r/ObsidianMD, XDA, 플러그인 공식 사이트, 블로그 리뷰

---

## 1. 사용자 페인포인트 (Claude 조사)

### 1-1. 수동 정리 피로감 (가장 많이 언급)

> "the fact that I had to be the one to move everything" — XDA

- 사용자가 직접 파일을 이동/분류해야 하는 부담
- Auto Note Mover(태그 규칙 기반 자동 이동)가 인기지만 "태그를 먼저 달아야 한다"는 한계
- QuickAdd + Auto Note Mover 조합이 "가장 가까운 해결책"이지만, Claude(AI)를 써서 bulk 정리하는 사용자도 존재
- 기존 도구는 규칙 기반이라 새로운 유형의 노트를 처리하지 못함

**출처**: [Self-organizing Obsidian vault — XDA](https://www.xda-developers.com/set-up-obsidian-vault-to-organize-itself-havent-touched-folder-structure-in-weeks/)

### 1-2. 고아 노트 대량 축적

> "150 of their 500 notes lack connections to other notes" — Obsidian Forum
> "정기 감사를 하고 싶은데 너무 고통스럽다" — Obsidian Forum

- 500개 중 150개가 아무 연결 없는 고아 노트라는 사례
- 기존 도구(Find Orphaned Files)가 "백링크 없는 것"만 잡아서 사용자 정의와 불일치
- 사용자가 원하는 "진정한 고아": 인바운드 AND 아웃바운드 링크 모두 없는 노트
- Graph View 필터링이 기대대로 동작하지 않음 (검색 문법 지원 부족)
- 수동 감사: "각 파일을 하나씩 열어 아웃바운드 링크를 확인" — 비현실적

**커뮤니티 의견 분류**:
- "강제로 링크를 만드는 건 무의미한 busywork" — 자연스러운 발견에 맡기라는 파
- "평가 폴더로 옮기고, 태그를 붙이고, 콘텐츠 유형별로 정리하라" — 단계적 정리 파
- "참조 자료는 원래 고아 상태가 정상" — 고아 자체가 문제가 아니라는 파

**출처**:
- [My Vault is an Orphanage — Obsidian Forum](https://forum.obsidian.md/t/my-vault-is-an-orphanage/41709)
- [Finding Isolated Notes — Obsidian Forum](https://forum.obsidian.md/t/finding-isolated-orphaned-notes/107207)

### 1-3. 유령 노트 (Ghost Notes)

> "half-formed ideas and single-sentence drafts that you'll never finish and can't bring yourself to delete"

- 반쯤 쓰다 만 노트, 한 줄짜리 메모가 쌓이는 문제
- 삭제하기엔 아깝고 방치하면 더 쌓이는 악순환
- "잘못된 초고를 CMS에 복사했다" 같은 실수 발생

**출처**: [Self-organizing Obsidian vault — XDA](https://www.xda-developers.com/set-up-obsidian-vault-to-organize-itself-havent-touched-folder-structure-in-weeks/)

### 1-4. 고아 첨부파일 + 깨진 링크

- 파일 이동/삭제 후 링크가 깨지는 문제
- Vault Inspector 플러그인이 최근 등장할 정도로 수요 있음
- 기존 도구들이 "탐지"만 하고 "수정"은 수동

**출처**: [Vault Inspector — Obsidian Forum](https://forum.obsidian.md/t/vault-inspector-find-broken-links-and-orphan-attachments/114637)

### 1-5. 태그 관리 혼란

- Tag Wrangler로 태그 통합 시도 → 오히려 중복 생성
- 교차 언어 태그 (#뱀파이어 vs #vampire) 탐지 도구 부재
- 태그가 수백 개로 늘어나면 관리 불가

**출처**: [Undesired and Duplicate Tags — Obsidian Forum](https://forum.obsidian.md/t/undesired-and-duplicate-tags/72113)

---

## 2. 경쟁 환경 분석 (Claude 조사)

### 2-1. 직접 경쟁자

| 플러그인 | 가격 | 핵심 가치 | 약점 |
|---|---|---|---|
| **Smart Connections** | $30/월, $299/년 | 시맨틱 검색, 관련 노트 연결, Chat Pro | 구조 변경 기능 없음 |
| **Copilot** | Free + Plus 유료 | Vault 전체 RAG 채팅, 모바일 지원 | 정리/유지보수 기능 없음 |
| **Note Companion** | BYOK 무료 | 자동 분류, 제목/포맷 변경, 음성/유튜브 | 기존 vault 리팩터링 미지원 |
| **Steward** (신규) | BYOK 무료 | AI 슬래시 커맨드, vault 관리, 자동화 | 초기 단계, 검색 불안정 |

### 2-2. 보조 도구

| 플러그인 | 가격 | 기능 | 한계 |
|---|---|---|---|
| **Auto Note Mover** | 무료 | 태그 기반 자동 파일 이동 | 규칙 수동 설정 필요 |
| **Vault Reorganizer** | 무료 | 대량 파일 이동 미리보기/적용 | 이동만 가능, 태그/링크 미처리 |
| **Tag Wrangler** | 무료 | 배치 태그 관리 | 중복 생성 문제 있음 |
| **Find Orphaned Files** | 무료 | 고아 파일/깨진 링크 탐지 | 탐지만, 수정 기능 없음 |
| **Vault Inspector** | 무료 | vault 건강 체크 | 탐지만 |

### 2-3. Smart Connections Pro 상세 분석

**가격**: $30/월 | $299/년 | Founding Supporter 일회성 (823/1000 소진)

**Pro 기능**:
- Connections Pro: 인라인 연결 뱃지, 1000+ 노트 성능 최적화, 알고리즘 커스텀
- Context Pro: 외부 파일/PDF/이미지를 AI 컨텍스트에 추가
- Chat Pro: 영속 스레드, 검색 가능한 대화, 드래그&드롭
- Connect Pro: Obsidian ↔ ChatGPT 보안 터널

**시사점**: Smart Connections가 유일하게 구독 모델로 성공. "시맨틱 검색"이라는 독보적 가치가 있기 때문.

**출처**: [Smart Connections Pro Pricing](https://smartconnections.app/pro-plugins/)

### 2-4. Steward 플러그인 (신규 경쟁자)

- AI 슬래시 커맨드 인터페이스
- TF-IDF 기반 검색 (Vaultend과 유사)
- vault 관리 (파일 생성/수정/삭제/이동)
- OpenAI, Gemini, DeepSeek, Ollama 지원
- 아직 초기 — 검색 불안정, 커맨드 문법 혼란 보고

**출처**: [Steward — Obsidian Forum](https://forum.obsidian.md/t/new-plugin-steward-ai-powered-search-vault-management-and-automation-workflows/107537)

---

## 3. 지불 의향 분석 (Claude 조사)

### 3-1. Reddit 커뮤니티 합의

> "minimal demand for paid AI features" — Reddit r/ObsidianMD

- **유료 저항이 강함**: Obsidian의 "무료 + 오픈소스" 문화가 핵심 가치
- **BYOK 선호**: "내 API 키를 쓰는데 플러그인이 유료면 이중 과금"
- **Smart Connections만 유일하게 구독 성공**: 독보적 시맨틱 검색 가치 때문
- **로컬 AI 선호**: Ollama + 무료 모델로 비용 0을 추구하는 경향

### 3-2. 유료 성공 조건

| 조건 | 근거 |
|---|---|
| 독보적 가치 | Smart Connections: 시맨틱 검색은 다른 곳에서 못 얻음 |
| 무료 코어가 충분히 강함 | 무료로도 쓸만해야 유료 전환 유인이 생김 |
| 구독보다 일회성 | Obsidian 자체가 일회성 구매 모델 |
| BYOK 유지 | 플러그인이 API 키를 가로채면 즉시 신뢰 상실 |

**출처**: [Obsidian Reddit Review 2026](https://www.aitooldiscovery.com/guides/obsidian-reddit)

---

## 4. 제품 방향 재검토 (사용자 분석)

### 4-1. 현재 Vaultend의 한계

> "현재 Vaultend의 기능은 유용하지만 '돈을 내고 반드시 써야 하는 이유'가 약합니다."

- Quick Ask, 자동 태깅, 폴더 정리 → Copilot, Note Companion, Smart Connections가 이미 강하게 점유
- 기능을 몇 개 더 붙이는 방식으로는 어려움 → **제품의 단위를 바꿔야 함**

### 4-2. 제안: "Vault용 Dependabot"

> "Vaultend는 노트를 대신 써주는 AI가 아니라, 당신의 Vault를 안전하게 리팩터링하는 AI 유지보수 엔지니어입니다."

단순히 문제 목록을 보여주는 것이 아니라, 정기적으로 Vault를 분석해서 **안전한 변경 제안서(Vault PR)**를 만들어준다.

**예시: 주간 Vault PR**

```
이번 주 Vault 개선 제안 7건
├── 중복된 #machine-learning, #머신러닝, #ml 통합
├── 내용이 82% 겹치는 노트 3개 병합
├── 사용되지 않는 태그 14개 제거
├── Projects/Alpha 관련 흩어진 노트 9개 재배치
├── 깨진 링크 6개를 실제 대상 노트로 연결
├── 오래된 프로젝트 노트 4개 Archive 이동
└── 관련 노트 12개로 MOC 생성
```

각 제안에 포함:
- 왜 이 변경을 제안했는지
- 변경되는 노트와 링크
- Before/After diff
- 영향받는 백링크
- AI 신뢰도
- 개별 승인/거절
- 전체 적용 + 원클릭 롤백

### 4-3. 구매력 높은 신규 기능 5개

#### (1) Vault Refactor

사용자가 목표를 선택하면 Vault 전체의 구조개선 계획을 생성.

**목표 예시**:
- 태그 500개를 100개 이하로 정리
- PARA 구조로 전환
- 폴더를 줄이고 링크 중심 구조로 전환
- 가져온 Notion/Evernote 자료 정리

**기존 도구와의 차별점**:
- Vault Reorganizer는 대량 이동의 미리보기/적용만 제공
- Vaultend는 콘텐츠 이해 기반 구조 제안 + 태그/폴더/속성/링크 동시 재설계 + 링크 무결성 검증 + 충돌 탐지 + 전체 롤백

**가격 정당성**: $49~99 일회성 구매 요인 가능.

#### (2) Intelligent Merge

중복 노트를 "탐지"에서 "안전한 통합 문서 생성"까지 확장.

유사 노트 N개 발견 시 분석:
- 공통 내용 / 고유 내용 / 충돌 내용 / 유지할 링크·첨부파일

실행:
- 통합 노트 생성 → 원본 백링크 리다이렉트 → 원본 Archive 이동 → 출처 추적 블록 삽입 → 전체 Undo

#### (3) Preference Learning Organizer

사용자의 승인/수정/거절 패턴을 학습:
- #AI → 항상 #artificial-intelligence 선택
- 회의 노트 → 항상 Work/Meetings/
- 새 폴더 생성 제안 반복 거절

Few-shot 예시 + 로컬 규칙으로 저장 (파인튜닝 불필요). 강력한 락인 효과.

#### (4) Knowledge Integrity Check

노트 내용의 건강 상태 검사:
- 서로 모순되는 주장
- 오래된 정보
- 출처 없는 단정
- 속성 불일치

초기에는 검증 가능한 범위(날짜/속성)부터 시작 — 오탐 시 신뢰 상실.

#### (5) Living MOC

단순 MOC 자동 생성이 아닌, vault 변화에 맞춰 계속 갱신되는 "Living MOC":
- 새 노트 추가 시 관련 MOC 업데이트 PR 생성
- 자동 수정이 아니라 제안 방식 (안전)

### 4-4. 추천 Pro 패키지

**Free**: 수동 Scan, 기본 탐지, Quick Ask, 단일 Organize, Undo

**Pro ($29 얼리버드 → $49 정가, 일회성)**:
- Vault Refactor Plan
- Intelligent Merge
- Preference Learning
- 자동 Vault PR + 주간 제안
- Knowledge Integrity Check
- Living MOC
- 트랜잭션 + 전체 롤백

### 4-5. 개발 우선순위

```
1. Vault PR (기반 인프라) — 가장 먼저
2. Intelligent Merge
3. Preference Learning
4. Knowledge Integrity
5. Living MOC
```

### 4-6. 우선순위 낮춤

> "음성 전사, 유튜브 요약, 웹 검색, 더 많은 AI 모델, 일반 채팅 고도화는 우선순위를 낮추세요. 이미 강한 경쟁자가 있고 Vaultend의 정체성도 흐려집니다."

---

## 5. 결론

### Vaultend v2의 비어있는 포지션

| 영역 | 기존 경쟁자 | Vaultend v2 |
|---|---|---|
| 발견 | Smart Connections | — |
| 대화 | Copilot | — |
| 입력 처리 | Note Companion | — |
| **구조 변경 + 안전한 실행** | **없음** | **Vaultend** |

핵심 메시지:

> **Vaultend는 노트를 대신 써주는 AI가 아니라, 당신의 Vault를 안전하게 리팩터링하는 AI 유지보수 엔지니어입니다.**

"자동 스케줄링에 돈을 내는 플러그인"이 아니라, **수년간 엉킨 Vault를 안전하게 개선해주는 전문가**에게 돈을 내는 제품.
