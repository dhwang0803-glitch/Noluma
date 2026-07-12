# Changelog

All notable changes to the **Knowledge Maintenance** plugin for Obsidian are documented here.

This project follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased] (development)

### Changed
- **RRF parameters optimized for bilingual**: Default `rrfK=20`, `rrfEmbeddingWeight=4.0` (was k=60, weight=2.0). Bilingual MRR improved from 92.7% → 96.3%.

### Added
- **Bilingual benchmark golden set**: 100 documents (47 Korean + 53 English) and 40 queries (20 KO + 20 EN) with 3-tier difficulty (Easy/Medium/Hard).
- **CI Hybrid benchmark**: GitHub Actions now runs both BM25-only and Hybrid (Gemini embedding) benchmarks with automatic regression detection.

---

## [0.4.0] - 2026-07-12

### Added
- **Phase 1 Quality Foundation**:
  - JSON mode for structured AI responses (eliminates parsing failures)
  - BM25 keyword search engine (replaces naive string matching)
  - Content-level duplicate detection via trigram Jaccard similarity
  - Prompt internationalization (bilingual EN/KO system prompts)
  - Exponential backoff retry with jitter for AI API calls
- **Phase 2 Differentiation Features**:
  - Change Tracking with dirty set persistence (`.knowledge-maintenance/dirty-set.json`)
  - Smart Scheduling — skips maintenance when no files have changed
  - TF-IDF corpus-based content duplicate detection (replaces trigram for higher precision)
  - Confidence Gating — low-confidence AI results are flagged, not auto-applied
  - API Embeddings (Gemini) with Reciprocal Rank Fusion (RRF) hybrid search
  - Vector store with JSON persistence for semantic search
- **Embedding benchmark infrastructure**: `vault-benchmark` CLI with `--golden`, `--sweep`, `--model`, `--weight`, `--k` options
- **Scale test**: 5000-document BM25 performance validation (P95 < 10ms)
- **QA infrastructure**: Issue templates (`qa_test_run.yml`, `qa_failure.yml`), manual test plan (30 TCs), embedding benchmark guide
- **CI/CD pipeline**: `ci.yml` (lint + tsc + test + build on PR), `benchmark.yml` (BM25 + Hybrid golden set)
- **DomainErrors i18n**: All domain error messages support EN/KO
- **`versions.json`** release history for BRAT compatibility

### Fixed
- **Embedding-only results lost** (Codex P1): `vault.readNote` fallback when note not in active index
- **Benchmark sweep caching**: Prevents redundant embedding API calls during parameter sweeps
- **Model name consistency**: Unified `gemini-embedding-001` reference across codebase

---

## [0.3.11] - 2026-07-12

### Fixed
- **AI hallucination prevention**: Strengthened prompt to prohibit inventing tags not present in vault's existing tag list.
- **Per-note unique tag recommendations**: AI now considers each note's specific content when selecting from vault tags, preventing generic tag suggestions.

---

## [0.3.10] - 2026-07-12

### Added
- **Empty vault tag creation**: When vault has fewer than 3 existing tags, AI prompt instructs creation of 3+ new relevant tags instead of forcing reuse of an insufficient pool.

---

## [0.3.9] - 2026-07-12

### Added
- **Organize Note token/cost display**: Shows token usage and estimated cost at the bottom of the Organize modal after AI classification.

---

## [0.3.8] - 2026-07-12

### Fixed
- **Tag reuse enforcement**: AI prompt now strictly requires reusing vault's existing tags (frequency-sorted, up to 200). New tags are only created when no existing tag fits the note's content.

---

## [0.3.7] - 2026-07-12

### Changed
- **Organize Note modal UX overhaul**: Interactive modal with editable tag chips, link chips, folder dropdown, and "Apply All" button. Results are no longer just a notification.

### Fixed
- **Codex P1/P2 fixes**: Tag chip removal, folder suggestion validation, modal lifecycle management.

---

## [0.3.6] - 2026-07-12

### Fixed
- **Organize Note tag deduplication**: Prevents suggesting tags already present on the note.
- **Non-existent folder suggestion**: Folder suggestions now validate against actual vault folder structure.

---

## [0.3.5] - 2026-07-12

### Added
- **Organize Note modal**: Dedicated result modal replacing the notification-based display. Shows category, summary, tags, links, and folder suggestion in an interactive UI.
- **Community submission preparation**: MIT LICENSE, comprehensive README rewrite, `versions.json`.

---

## [0.3.4] - 2026-07-12

### Added
- **History log refresh button**: Reload latest entries without restarting Obsidian.
- **Restore action recording**: Undo operations are now recorded in the activity log.
- **GitHub issue templates**: Bug report and feature request templates.

### Fixed
- **Clock adapter initialization order** (Codex P1): `clockAdapter` now initializes before `historyAdapter` to prevent timestamp errors.
- **Select-all control**: Replaced toggle with checkbox for consistent UX in maintenance results.

---

## [0.3.3] - 2026-07-11

### Fixed
- **Dot-prefix folder I/O**: History and search index adapters now use `vault.adapter` for reading/writing to `.knowledge-maintenance/` folder, fixing permission issues on some platforms.

---

## [0.3.2] - 2026-07-11

### Added
- **Undo/Redo for dismiss actions**: Dismissed maintenance items can be undone (reappear) and redone (re-dismissed).

### Fixed
- **History view rendering bug**: Fixed issue where history entries were not displaying correctly after multiple actions.

---

## [0.3.1] - 2026-07-11

### Fixed
- **Filter chip active state**: Severity filter chips now use their respective severity colors (red/orange/blue) instead of generic accent blue when active.

---

## [0.3.0] - 2026-07-11

### Added
- **Internationalization (i18n)**: English as default language with Korean support. Language selector in settings (Auto / English / Korean). Auto-detection based on Obsidian locale.
- **Severity badges**: Visual Critical / Warning / Info badges on maintenance results. Issues are now sorted by severity (critical first).
- **Result filters**: Filter maintenance results by severity chips, issue type chips, and real-time text search by file path — a differentiator over comparable plugins.
- **DynamicAIAdapter**: AI provider, API key, and model changes now apply immediately without restarting the plugin. Uses a proxy pattern with ConfigPort reference and adapter caching.
- **Immediate locale refresh**: Changing the display language instantly updates all open views (Maintenance Results, Log, Inbox Status) without restart.

### Fixed
- **XSS vulnerability in Quick Ask modal**: Replaced `innerHTML` with DOM API (`createEl`) for loading and error messages (Codex P2).
- **Search input focus loss**: Re-render no longer destroys search input focus; cursor position is restored (Codex P2).
- **dismissBatch error handling**: Added per-item try/catch with success/failed counters, matching the `executeBatch` pattern (Codex P3).
- **Filter chip accessibility**: Added `aria-pressed` attribute to severity and type filter chips (Codex P4).

### Changed
- Locale description updated to clarify that command palette names require restart while views update instantly.
- `wireAdapters()` in `main.ts` now creates ConfigPort before AI adapter, removing the static `createAIAdapter()` method.

---

## [0.2.7] - 2026-07-10

### Added
- **Maintenance exclude folders**: New setting to exclude specific folders from maintenance scans (comma-separated). QuickAsk folder is excluded by default.
- **Exclude file patterns**: Glob-based file pattern exclusion for maintenance scans.
- **Exclude tags**: Notes with specified tags are excluded from maintenance scans.

### Fixed
- **Broken link false positives**: `findBrokenLinks()` now receives the full note list, preventing incorrect orphan detection across folder boundaries (Codex P1).
- **Trailing slash normalization**: Folder paths are normalized to prevent filter bypass with trailing slashes (Codex P2).

---

## [0.2.6] - 2026-07-10

### Changed
- **Quick Ask modal UX overhaul**:
  - Markdown rendering via `MarkdownRenderer.renderMarkdown()` for proper formatting of AI responses.
  - Enlarged modal (700px width, 85vh height) for comfortable reading.
  - Added close button (visible before question and after answer).
  - One-click note opening with auto-close (2-touch principle).
  - Ctrl+Enter keyboard shortcut for sending questions.
  - Proper Component lifecycle management (`renderComponent`).

---

## [0.2.5] - 2026-07-10

### Added
- **Quick Ask date-based folder structure**: Answers are saved to `QuickAsk/YYYY-MM-DD/` subfolders for better organization.
- **Maintenance batch editing**: Checkbox selection with batch actions — apply tags, remove links, delete, archive, and dismiss multiple items at once.

### Fixed
- Path casting issue in `createNotePath` for folder paths (Codex P1).

---

## [0.2.4] - 2026-07-09

### Fixed
- **writeNote race condition**: `vault.create()` now falls back to `vault.modify()` when the file already exists, preventing race condition errors during concurrent note creation.

---

## [0.2.3] - 2026-07-09

### Fixed
- **BRAT update detection**: Bumped `manifest.json` and `package.json` versions to match the release tag, fixing BRAT's inability to detect updates.

---

## [0.2.2] - 2026-07-09

### Added
- **Quick Ask dual save mode**: Choose between timestamp-based filenames (one file per question) or Daily Note mode (append to a single daily file). Configurable in settings.
- **Daily Note size splitting**: When a Daily Note exceeds the size limit (default 200KB), a new numbered file is automatically created (e.g., `2026-07-10-2.md`).

### Fixed
- **Gemini JSON code block wrapping**: Added `stripCodeBlock()` to handle Gemini's habit of wrapping JSON responses in markdown code fences.
- **Rate limit retry**: Added `requestWithRetry()` with exponential backoff and `Retry-After` header support for 429/503 responses.
- **Folder creation race condition**: `ensureFolderExists()` now selectively ignores only "Folder already exists" errors instead of swallowing all exceptions.
- **stripCodeBlock case sensitivity**: Added case-insensitive flag to regex for code block detection (Codex P2).

---

## [0.2.1] - 2026-07-09

### Fixed
- **Unnecessary catch-up API calls**: `runCatchUp()` no longer makes AI API calls when `autoApplyInbox` is disabled.
- **AI adapter JSON parsing**: Improved error handling for malformed AI responses.

---

## [0.2.0] - 2026-07-09

### Added
- **Vault Maintenance Result UI**: Sidebar view displaying scan results with per-issue action buttons (delete, remove link, create note, apply tags, dismiss).
- **`ApplyMaintenanceActionUseCase`**: Executes user-approved maintenance actions with `previousContent` backup and history recording.
- **`MaintenanceAction` discriminated union**: 5 action variants — delete-orphan, remove-broken-link, create-missing-note, apply-missing-tags, dismiss.
- **Dismissed issue tracking**: Dismissed items persist across re-renders via `dismissedIds` Set.
- **BRAT release workflow**: GitHub Actions workflow for automated releases (build + attach `main.js`, `manifest.json`, `styles.css`).

### Fixed
- **Dynamic import runtime failure**: Replaced all `await import('obsidian')` with static imports. esbuild marks obsidian as external, so dynamic imports pass the build but fail at runtime in Obsidian's CJS environment.
- **Heading fragment in note creation**: `createMissingNote` now strips `#section` fragments from filenames.
- **Inline tag duplication**: `extractFrontmatterTags` now correctly extracts only frontmatter tags, preventing inline tags from being copied to frontmatter.

---

## [0.1.0] - 2026-07-09

### Added
- **Quick Ask**: One-shot AI queries with auto-save to vault. Supports OpenAI and Google Gemini providers.
- **Inbox Processing**: Automatic note classification, tagging, and folder routing powered by AI.
- **Vault Maintenance Engine**: Automated detection of orphan notes, broken links, missing tags, duplicate candidates, untagged notes, and empty notes.
- **Privacy Rules**: Configurable rules to exclude sensitive notes from AI processing — folder exclude, tag exclude, frontmatter exclude, and content redaction.
- **Clipboard Capture**: Quick capture of clipboard content as a new note.
- **Note Organizer**: AI-powered single-note classification and tagging.
- **Maintenance History Log**: Activity log view tracking all maintenance actions.
- **Inbox Status View**: Dashboard showing inbox processing statistics.
- **Clean Architecture**: Domain-driven design with strict layer separation (domain, application, adapters, UI).

### Infrastructure
- TypeScript + esbuild build pipeline.
- 228 unit tests across 22 test files.
- Pre-commit security audit hook (credential scanning, lint).
- Codex cross-verification pipeline for independent code review.
