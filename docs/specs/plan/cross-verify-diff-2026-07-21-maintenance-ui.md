# 교차 검증 보고서 — 2026-07-21 Maintenance UI Cleanup

## 검증 정보

- **검증 대상**: diff — feature/maintenance-ui-cleanup (미커밋 변경)
- **검증 방법**: CLI 직접 실행 (`codex exec`)
- **검증 모델**: Codex (gpt-5.6-sol)
- **토큰 사용량**: 52,635

## 주요 발견 사항

### 1. FAIL — 사용자 입력 링크 정규화 부족
- **파일**: `OrganizeBatchPreviewModal.ts:111`
- **내용**: `[[Note]]` 입력 시 `[[Note]].md`가 되고, `.MD` 입력 시 `.MD.md`가 됨
- **심각도**: P1 (CRITICAL)
- **대응**: ✅ **수정 완료** — `[[` `]]` 제거, 대소문자 무시 `.md` 정규화 추가
- **사실 확인**: 유효 (코드에서 확인)

### 2. FAIL — `|| true` 상시 참 우회 코드
- **파일**: `OrganizeBatchPreviewModal.ts:86`
- **내용**: `if (editable.links.length > 0 || true)` — 디버그 잔재
- **심각도**: P1 (CRITICAL)
- **대응**: ✅ **수정 완료** — 조건문 제거, `renderEditableLinks()` 직접 호출
- **사실 확인**: 유효

### 3. WARN — 미사용 `Setting` import
- **파일**: `OrganizeBatchPreviewModal.ts:1`
- **심각도**: P3 (LOW)
- **대응**: ✅ **수정 완료** — import에서 제거
- **사실 확인**: 유효

### 4. WARN — `.organize-footer` CSS 중복
- **파일**: `styles.css:726, 743`
- **심각도**: P3 (LOW)
- **대응**: ✅ **수정 완료** — 중복 정의 제거
- **사실 확인**: 유효

### 5. WARN — `l as NotePath` 타입 단언
- **파일**: `OrganizeBatchPreviewModal.ts:177`
- **심각도**: P2 (HIGH)
- **대응**: ✅ **수정 완료** — `createNotePath()` 사용으로 변경
- **사실 확인**: 유효

### 6. WARN — 빈 상태 텍스트 동기화 미흡
- **파일**: `OrganizeBatchPreviewModal.ts:90`
- **심각도**: P3 (LOW)
- **대응**: ✅ **수정 완료** — 링크 추가 시 빈 상태 DOM 제거
- **사실 확인**: 유효

### 7. WARN — Dead code (TF-IDF 계산, LinkOrphan 액션, 미사용 i18n 키)
- **심각도**: P3 (LOW)
- **대응**: ⏭ **보류** — TF-IDF는 Organize Selected에서 여전히 사용, i18n 키는 향후 정리
- **사실 확인**: 부분 유효 (TF-IDF는 오탐 — 여전히 사용 중)

### 8. WARN — `_entries`, `_missingTags` 미사용 매개변수
- **심각도**: P3 (LOW)
- **대응**: ⏭ **보류** — 언더스코어 컨벤션으로 의도적 미사용 표시, Organize Tags에서 활용 예정
- **사실 확인**: 의도적 설계

## 기준별 판정 (수정 후)

| 기준 | 판정 | 비고 |
|------|------|------|
| 정확성 | PASS | P1 2건 수정 완료 |
| 하드코딩/회피 패턴 | PASS | `\|\| true` 제거 |
| 타입 안전성 | PASS | `createNotePath()` 사용 |
| 보안 | PASS | 자격증명 노출 없음 |
| 아키텍처 정합성 | PASS | Clean Architecture 준수 |
| 코드 품질 | PASS | 미사용 import, CSS 중복 정리 |

## 검증 후 수정 요약

| # | 수정 내용 | 파일 |
|---|----------|------|
| 1 | `[[]]` 제거 + 대소문자 무시 `.md` 정규화 | OrganizeBatchPreviewModal.ts |
| 2 | `\|\| true` 제거, 무조건 renderEditableLinks 호출 | OrganizeBatchPreviewModal.ts |
| 3 | 미사용 `Setting` import 제거 | OrganizeBatchPreviewModal.ts |
| 4 | `l as NotePath` → `createNotePath(l)` | OrganizeBatchPreviewModal.ts |
| 5 | `.organize-footer` CSS 중복 제거 | styles.css |
| 6 | 링크 추가 시 빈 상태 DOM 제거 | OrganizeBatchPreviewModal.ts |

## 종합 판정 — PASS (수정 후)

Codex가 발견한 P1 2건, P2 1건, P3 3건 모두 수정 완료. Dead code 정리(P3)와 미사용 매개변수(P3)는 향후 과제로 보류.
- 오탐률: 12.5% (8건 중 1건 — TF-IDF dead code 주장은 부분 오탐)
