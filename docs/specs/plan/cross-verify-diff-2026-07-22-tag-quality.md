# 교차 검증 결과 — 태그 품질 개선 + Organize Selected 버튼 활성화

- **검증 대상**: diff — development 미커밋 변경 (3개 파일)
- **검증 방법**: CLI 직접 실행
- **검증 모델**: Codex (gpt-5.6-sol)
- **불일치 항목**: 0건
- **Codex 단독 지적**: 1건 (유효: 1)
- **오탐률**: 0%

## Codex 단독 지적

| # | 심각도 | 파일 | 지적 내용 | 사실 확인 | 대응 |
|---|--------|------|----------|----------|------|
| 1 | P1 | main.ts:849 | `previewOrganizeNotes`에 `skipLinkSuggestion: true`를 넣으면 orphan notes의 "Organize Selected"도 링크 제안 불가. Orphan notes는 링크로 고아 상태 해소 필요 | ✅ 유효 — 동일 콜백이 orphan/untagged/missing-tags 3개 섹션에 공유됨 | **수정**: 콜백 분리 — `onOrganizePreview`(orphan, 링크 포함) + `onOrganizeTagsOnly`(untagged/missing-tags, `skipLinkSuggestion: true`) |

## 수정 사항

- `main.ts`: `previewOrganizeNotes` 원복 (링크 포함), `previewOrganizeNotesTagsOnly` 신규 추가
- `MaintenanceResultView.ts`: 생성자에 `onOrganizeTagsOnly` 콜백 추가, `addOrganizeButton`에 `previewFn` 파라미터 추가로 섹션별 분기
- orphan notes → `onOrganizePreview` (링크 + 태그)
- untagged/missing-tags → `onOrganizeTagsOnly` (태그만, `skipLinkSuggestion: true`)
