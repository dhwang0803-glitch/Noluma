# 교차 검증 결과 — Organize Tags

- **검증 대상**: diff — feature/organize-tags (12 files)
- **검증 방법**: CLI 직접 실행
- **검증 모델**: Codex (gpt-5.6-sol)
- **불일치 항목**: 0건
- **Codex 단독 지적**: 5건 (유효: 3, 부분유효: 1, v1한계: 1)
- **오탐률**: 0%

## Codex 단독 지적

| # | 심각도 | 파일 | 지적 내용 | 대응 |
|---|--------|------|----------|------|
| 1 | P1 | OrganizeTagsView.ts:369-376 | editEntry에서 entry.group만 갱신하고 this.result.groups는 미갱신 → render() 시 편집 결과 소실 | **수정**: oldGroup 참조 저장 후 result.groups에서 교체 |
| 2 | P1 | OrganizeTagsUseCase.ts:326-332 | canonical+variant 모두 가진 노트가 affectedNotes에서 제외됨 → variant 태그 미제거 | **수정**: canonicalNotes 필터 제거, variant 가진 모든 노트 포함 |
| 3 | P2 | FileTagGroupCacheAdapter.ts:84-86 | AI 없이 캐시 생성 후 AI 추가 시 meta=null → compatible=true → LLM 스킵 | **수정**: meta 없고 processedTags 있으면 incompatible 반환 |
| 4 | P1 | OrganizeTagsUseCase.ts:104-108 | 증분 시 새 태그 1개만 추가되면 LLM 스킵, 기존 태그와 비교 불가 | v1 한계 수용 — 태그 1개로는 그룹핑 쌍이 없음. 향후 기존 singleton과 합쳐 배치 가능 |
| 5 | P2 | OrganizeTagsUseCase.ts:289-293 | inline 태그가 affectedNotes에 포함되지만 mergeDuplicateTags는 frontmatter만 처리 | v1 한계 — 기존 merge 인프라의 제약. Organize Folder도 동일 |

## 수정 사항

- `OrganizeTagsView.ts`: editEntry에서 oldGroup 참조 저장 + result.groups 매핑 교체
- `OrganizeTagsUseCase.ts`: buildDuplicateTagGroups에서 canonicalNotes 필터 제거
- `FileTagGroupCacheAdapter.ts`: isCompatible에서 meta=null 시 processedTags.size === 0 조건
