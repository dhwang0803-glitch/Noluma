# 교차 검증 보고서 — Phase 4: Preference Learning diff

- **검증 대상**: diff — Phase 4 Preference Learning (19 파일, 신규 9 + 수정 10)
- **검증 방법**: CLI 직접 실행 (`codex review --base development`)
- **검증 모델**: Codex (gpt-5.6-sol)
- **불일치 항목**: 0건
- **Codex 단독 지적**: 4건 (유효: 4, 오탐: 0)
- **합의 항목**: Clean Architecture 준수, 하위 호환 설계 적절

## Codex 지적 사항

| # | 심각도 | 파일 | 지적 | 대응 |
|---|--------|------|------|------|
| 1 | P2 | OrganizeVaultView.ts:371-383 | `approveAll()`이 preference recording을 우회 — 일괄 승인이 학습에 반영되지 않음 | **즉시 수정** — for 루프 내에 `recordPreference.execute()` 추가 |
| 2 | P2 | OrganizeVaultView.ts:356-357 | fire-and-forget `recordSignal()` 동시 호출 시 read-modify-write 경쟁 조건 | **인지** — Obsidian 단일 스레드 환경에서 실제 확률 매우 낮음. 향후 큐잉 고려 |
| 3 | P2 | FilePreferenceAdapter.ts:67-76 | 학습된 규칙 삭제 시 signals가 남아 `deriveRules()`가 규칙 재생성 | **즉시 수정** — `deleteRule()`에서 해당 패턴의 signals도 함께 제거 |
| 4 | P2 | PreferenceExtractor.ts:27 | merge proposal의 `metadata`(전체 노트 본문)이 signal에 불필요하게 저장 | **즉시 수정** — `extractSignal()`에서 metadata를 undefined로 설정 |

## 수정 상세

### Fix 1: approveAll에 preference recording 추가
- `OrganizeVaultView.approveAll()` 내 for 루프에 `this.recordPreference.execute(proposal, 'approved').catch(() => {})` 추가
- 일괄 승인도 개별 승인과 동일하게 학습에 반영됨

### Fix 2: 동시 호출 경쟁 조건 (인지만)
- Obsidian은 단일 스레드 이벤트 루프에서 동작하며, 사용자 클릭 간 충분한 간격이 존재
- fire-and-forget의 I/O는 Obsidian vault adapter 내부에서 순차 처리됨
- 실제 데이터 손실 확률이 극히 낮아 현 단계에서는 수정 불요. 향후 사용량 증가 시 뮤텍스/큐 패턴 고려

### Fix 3: 삭제된 규칙 재생성 방지
- `FilePreferenceAdapter.deleteRule()`에서 삭제 대상 규칙의 패턴·타입·액션이 일치하는 signals도 함께 필터링
- manual 규칙은 signals 기반이 아니므로 signals 제거 대상에서 제외
- 이후 `recordSignal()`이 호출되어도 해당 패턴의 signals가 없으므로 규칙이 재생성되지 않음

### Fix 4: metadata 제거
- `PreferenceExtractor.extractSignal()`에서 `metadata: proposal.metadata` → `metadata: undefined`
- merge proposal의 전체 노트 본문이 preferences.json에 저장되는 것을 방지
- 학습에 필요한 정보(targetPath, diffs, rationale, confidence)는 유지

## 종합 판정

P2 4건 중 3건 즉시 수정, 1건 인지 후 **PASS**. 보안 위반·아키텍처 드리프트 없음.
수정 후 546 tests 전체 통과, TypeScript 컴파일 에러 없음.
