# 교차 검증 결과 — 2026-07-19 임베딩 캐시 호환성 수정

## 검증 정보
- 검증 대상: diff (4 files)
- 검증 방법: CLI 직접 실행 (`codex exec`)
- 검증 모델: Codex (gpt-5.6-sol)
- 종합 판정 (원본): FAIL → **수정 후 PASS**

## 지적 사항

| # | 심각도 | 지적 | 사실확인 | 대응 |
|---|--------|------|---------|------|
| 1 | HIGH | dimension=0/빈 embeddings를 성공으로 처리 | CONFIRMED | **수정** — dimension>0, embeddings.length>0 검증 추가 |
| 2 | HIGH | provider 변경 후 sync 미호출 | CONFIRMED | **수정** — 콜백에 syncEmbeddingsBackground() 추가 |
| 3 | HIGH | 설정 없으면 캐시 미로드 → 데이터 손실 | CONFIRMED | **수정** — load()를 hasAIProviderConfig 밖으로 이동 |
| 4 | HIGH | API키/URL 입력 변경 시 재초기화 미유발 | CONFIRMED | 후속 — 이 PR 범위 초과 |
| 5 | MEDIUM | Custom keyless provider 차단 | CONFIRMED | **수정** — customBaseUrl만 필수 |
| 6 | MEDIUM | fire-and-forget 콜백 경쟁 상태 | CONFIRMED | 후속 — 기존 패턴과 동일 |
| 7 | MEDIUM | 호환성 키에 model 미포함 | CONFIRMED | 후속 — 별도 작업 |
| 8 | MEDIUM | 테스트 누락 | CONFIRMED | 부분 수정 — empty embeddings 테스트 추가 |

## 수정 내용 (4건)

1. `AIEmbeddingAdapter.ts`: `initialize()` — `response.dimension <= 0 || response.embeddings.length === 0` 시 `false` 반환
2. `main.ts`: `vectorStoreAdapter.load()`, `tagEmbeddingCacheAdapter.load()`를 `hasAIProviderConfig()` 밖으로 이동
3. `main.ts`: `hasAIProviderConfig()` — `custom` 케이스를 `!!s.customBaseUrl`로 변경
4. `main.ts`: `onAIProviderChanged` 콜백에 `syncEmbeddingsBackground()` 호출 추가

## 후속 백로그

- API 키/URL/model 입력 변경 시 재초기화 콜백 (debounce 필요)
- 호환성 키에 embedding model 포함
- fire-and-forget 콜백 → mutex/generation token

## 오탐률

0% (8건 전체 CONFIRMED)
