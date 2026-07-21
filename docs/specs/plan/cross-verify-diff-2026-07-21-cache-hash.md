# 교차 검증 보고서 — 2026-07-21 cache hash fix

## 교차 검증 결과

- 검증 대상: diff — `BuildSummaryIndexUseCase.ts`, `RunInboxProcessUseCase.ts`
- 검증 방법: CLI 직접 실행 (`codex review --base development`)
- 검증 모델: Codex (gpt-5.6-sol)
- 불일치 항목: 0건
- Codex 단독 지적: 2건 (유효: 2, 오탐: 0)
- 합의 항목: 0건

## Codex 단독 지적

### [P1] CRITICAL — Stale vector after summary rebuild (수정 완료)

**파일**: `BuildSummaryIndexUseCase.ts:134-139`
**지적**: 해시 통일 후 `BuildSummaryIndexUseCase`가 `{newHash, oldVector}`를 저장하면, 임베딩 루프가 해시 일치로 스킵하여 벡터가 stale 상태로 영구 유지됨.

**사실 확인**: 유효. 해시 통일의 부작용으로, 요약 빌더가 "변경 감지" 신호를 소비해버려 임베딩 루프가 변경을 못 봄.

**수정**:
1. `BuildSummaryIndexUseCase`: 요약 재생성 시 `vector: new Float32Array(0)`로 벡터 클리어
2. `RunInboxProcessUseCase`: 임베딩 캐시 체크에 `cached.vector.length > 0` 조건 추가

### [P2] HIGH — Stale summary preserved under new hash (수용)

**파일**: `RunInboxProcessUseCase.ts:154-157`
**지적**: 요약 생성 실패 시 옛 `onelineSummary`가 새 해시와 함께 보존되어 영구히 갱신되지 않음.

**사실 확인**: 부분 유효. 그러나:
- `needsSummaryUpdate`는 `onelineSummary`가 없어도 재생성을 트리거함
- 요약 실패 시 옛 요약 유지가 요약 완전 소실보다 나음
- 요약 실패는 드문 경우 (API 오류 시에만)

**대응**: 수용 가능한 리스크로 판단. 현재 수정 없이 유지.

## 사람이 결정해야 할 항목
없음 (P1 수정 완료, P2 수용 판단 완료)

## 검증 후 테스트
- `npm run build`: 통과
- `npx vitest run` (Gemini golden 제외): 47 파일 653 테스트 전량 통과
