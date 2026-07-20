# 세션 회고 — 2026-07-21 feature/embedding-strip-frontmatter

## 세션 요약
- 브랜치: feature/embedding-strip-frontmatter
- 커밋: 0건 (PR 생성 직전)
- 변경 파일: 10개
- 교차 검증: 실행 예정

## 계획 vs 실제

이 세션은 v0.8.16(threshold 0.70) 배포 후 실제 테스트 결과 분석에서 시작됨. 명시적 계획 문서 없이 대화 기반으로 진행.

| Phase | 계획 | 실제 결과 | 일치 |
|-------|------|----------|------|
| 유사도 분포 분석 | Inbox 47개 노트 유사도 분포 확인 | 0.55~0.70 구간 상세 분석 완료 | 완료 |
| 노이즈 원인 분석 | 노이즈 문서 직접 읽고 원인 파악 | YAML frontmatter 태그 오염이 핵심 원인 발견 | 완료 |
| threshold 결정 | 데이터 기반 threshold 선택 | 0.55 + frontmatter strip으로 결정 | 완료 |
| 코드 수정 | frontmatter strip + threshold 설정 UI | 10개 파일 수정 완료 | 완료 |

## 패턴 분석

### Keep (유지)
- 실제 vault 데이터로 유사도 분포 분석 스크립트를 작성하여 데이터 기반 의사결정
- 노이즈 문서를 직접 읽어 구조적 원인을 파악한 점 (태그 오염 발견)
- 사용자의 도메인 지식(Obsidian linking culture)을 반영한 threshold 선택

### Drop (중단)
- 없음 — 이 세션은 비교적 직선적으로 진행됨

### Try (시도)
- 임베딩 품질 변경 시 A/B 비교 스크립트를 미리 준비 (frontmatter strip 전/후 비교)

## 하네스 개선 제안
- 없음

## 측정 지표
- 계획 이행률: 100% (4/4 Phase)
- 자기 편향 발생: 0회
- 아키텍처 드리프트: 없음
