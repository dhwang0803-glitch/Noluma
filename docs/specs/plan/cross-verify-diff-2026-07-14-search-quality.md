# 교차 검증 보고서 — feature/search-quality (2026-07-14)

## 검증 대상
- 유형: diff (PR 범위)
- 브랜치: feature/search-quality → development
- 변경 파일: JsonVectorStoreAdapter.ts, JsonVectorStoreAdapter.test.ts, QuickAskUseCase.test.ts, main.ts, VectorStorePort.ts, SyncEmbeddingsUseCase.ts

## 검증 방법
- CLI 직접 실행: `codex exec`
- 검증 모델: Codex (o4-mini)

## 종합 판정: FAIL → P1 수정 완료 후 PASS

## 지적 사항

| # | 심각도 | 지적 내용 | 사실 확인 | 대응 |
|---|--------|----------|----------|------|
| 1 | FAIL (P1) | `rebuildAll()`→`clear()`→메타데이터 삭제, 매 시작 전체 재구축 반복 | **CONFIRMED** — setMeta→syncEmbeddingsBackground→rebuildAll→clear 순서에서 메타 삭제됨 | **수정 완료**: `clearEntries()` 추가, `rebuildAll()`이 벡터만 삭제 |
| 2 | WARN (P2) | version `1` 중복 하드코딩 + `unknown/0` sentinel | **유효** | **수정 완료**: `setMeta`가 내부적으로 SCHEMA_VERSION 관리, 호출자는 version 미지정 |
| 3 | WARN (P3) | 메타데이터 수명주기 3곳 분산 | **유효** — 구조적 관찰이나 clearEntries 분리로 역할 명확화됨 | 향후 개선 대상 |
| 4 | PASS | 보안 이상 없음 | PASS | — |
| 5 | WARN (P3) | `load()` 타입 단언 런타임 검증 없음 | **유효** — 현 범위 밖 | 향후 개선 대상 |

## 수정 내역
1. `VectorStorePort`에 `clearEntries()` 추가 (벡터만 삭제, 메타데이터 보존)
2. `JsonVectorStoreAdapter.clearEntries()` 구현
3. `SyncEmbeddingsUseCase.rebuildAll()`에서 `clear()` → `clearEntries()` 변경
4. `setMeta()`가 `Pick<VectorStoreMeta, 'provider' | 'dimension'>` 수신, version은 내부 관리
5. `main.ts`에서 `version: 1` 제거
6. 테스트: `clearEntries` 보존 테스트 추가 (총 403개)
