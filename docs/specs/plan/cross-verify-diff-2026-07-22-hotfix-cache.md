# 교차 검증 결과 — Hotfix Cache Invalidation

- **검증 대상**: diff — 0.9.1~0.9.2 hotfix (b2f05c0..e784612)
- **검증 방법**: CLI 직접 실행
- **검증 모델**: Codex (gpt-5.6-sol)
- **불일치 항목**: 0건
- **Codex 단독 지적**: 2건 (유효: 2)
- **오탐률**: 0%

## Codex 단독 지적

| # | 심각도 | 파일 | 지적 내용 | 사실 확인 | 대응 |
|---|--------|------|----------|----------|------|
| 1 | P1 | OrganizeTagsUseCase.ts:128-134 | 정상 빈 응답(`{"groups":[]}`)과 에러 실패를 구분 못함 → 진짜 그룹 없는 vault에서 매번 LLM 재호출 = 과금 반복 | ✅ 유효 — 프롬프트가 `{"groups":[]}` 허용, 현재 코드는 이를 실패와 동일 취급 | **수정**: llmGrouping이 성공한 배치의 태그를 processedTags로 반환. 성공 빈결과는 캐시됨 |
| 2 | P2 | OrganizeTagsUseCase.ts:127-128 | 다중 배치에서 일부 실패 시, 성공 배치가 1개라도 있으면 전체 currentTagSet 캐시 → 실패 배치 태그 영구 스킵 | ✅ 유효 — try-catch가 배치별이라 실패 배치 태그만 빠져야 함 | **수정**: 배치 성공 시에만 해당 배치 태그를 processedTags에 추가 |

## 수정 사항

- `llmGrouping` 반환 타입에 `processedTags: Set<string>` 추가
- 배치 try 블록 내에서 성공 시에만 `processedTags.add(batch tags)`
- `execute()` 캐시 저장: `currentTagSet` 대신 `cachedProcessedTags ∪ groupedTags ∪ llmProcessedTags`
