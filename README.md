# Knowledge Maintenance — Obsidian Plugin

An AI-powered knowledge maintenance engine for Obsidian. Automatically classify, tag, link, and maintain your vault.

Focus on writing. Let AI handle the organization.

---

## Features

### Quick Ask

Ask AI questions using your vault as context — right from the Command Palette.

- Automatically searches relevant notes and includes them in the AI prompt
- Saves answers to new notes or Daily Notes (configurable)
- Extracts `[[wikilinks]]` from responses for link suggestions
- Displays token usage and cost in real-time
- Markdown rendering for formatted AI responses
- Date-based folder structure (`QuickAsk/YYYY-MM-DD/`)
- Ctrl+Enter keyboard shortcut to send

### Note Organizer

Run `Organize Current Note` to let AI analyze the active note.

- Category classification (technology, personal, work, etc.)
- Automatic tag suggestions
- Link suggestions to related notes in your vault
- Folder move suggestions based on classification

### Inbox Processing

Automatically detects and processes new notes in your designated Inbox folder.

- Real-time file creation/modification monitoring (2-second debounce)
- Manual trigger via `Process Inbox` command
- Catches up on unprocessed notes at app startup
- Configurable auto-apply or manual approval

### Vault Maintenance

Run `Run Maintenance` to scan your entire vault for issues — or right-click a folder to scan just that section.

- **Orphan notes**: Notes not linked from anywhere (with canvas reference awareness)
- **Duplicate candidates**: Jaccard similarity-based detection with side-by-side comparison
- **Broken links**: `[[wikilinks]]` pointing to non-existent notes (including heading/block fragment validation)
- **Missing tags**: AI-powered tag suggestions based on content
- **Untagged notes**: Notes without any tags
- **Empty notes**: Zero-content notes (with backlink impact preview)
- Automatic scheduling (configurable interval for background execution)
- **Folder-scoped scan**: Right-click any folder to scan only that subtree

#### Severity Badges

Each issue category is assigned a severity level for quick visual triage:

| Severity | Issues | Visual |
|----------|--------|--------|
| Critical | Broken links, Empty notes | Red badge |
| Warning | Orphan notes, Duplicates | Orange badge |
| Info | Untagged notes, Missing tags | Blue badge |

Results are sorted by severity (critical first) so you always see the most urgent issues at the top.

#### Filtering

Quickly narrow down results in large vaults:

- **Severity chips**: Toggle Critical / Warning / Info categories
- **Type chips**: Toggle individual issue types
- **Text search**: Real-time path-based filtering — type a folder name or note title to instantly find relevant issues

#### Batch Actions

Select multiple items and apply actions in bulk:

- Archive, Delete, Dismiss, Remove Links, Apply Tags — all in one click
- Select All / Deselect All toggle

### Privacy Protection

Fine-grained control over what gets sent to AI.

| Rule Type | Behavior |
|-----------|----------|
| Folder exclude | Completely exclude notes in specified folders from AI context |
| Tag exclude | Exclude notes with specific tags |
| Frontmatter exclude | Exclude notes with specific frontmatter keys |
| Content redact | Replace regex-matched text with `[REDACTED]` before sending |

**Content redaction example**: Setting the pattern `password:\S+` will replace `password:abc123` with `[REDACTED]` before sending to AI. The original note is never modified.

### Clipboard Capture

Save clipboard text as a new note instantly.

### Activity Log

Track all actions (classification, organization, Quick Ask saves, maintenance actions) in the Activity Log sidebar panel.

---

## Internationalization

The plugin supports multiple languages:

- **English** (default)
- **Korean** (한국어)
- **Auto** — follows your Obsidian language setting

Change the language in Settings. Views update immediately; command palette names update after restart.

---

## Settings

### Language

| Setting | Description | Default |
|---------|-------------|---------|
| Display Language | Plugin interface language | Auto (follows Obsidian) |

### AI Provider

| Setting | Description | Default |
|---------|-------------|---------|
| AI Provider | OpenAI or Google Gemini | OpenAI |
| API Key | Your provider's API key | — |
| Model | Model name to use | gpt-4o |

> AI settings (provider, API key, model) apply immediately — no restart needed.

### Inbox

| Setting | Description | Default |
|---------|-------------|---------|
| Inbox Folder | Folder for unprocessed notes | Inbox |
| Auto Apply | Automatically apply processing results | false |

### Quick Ask

| Setting | Description | Default |
|---------|-------------|---------|
| Save Mode | Timestamp (separate file per question) or Daily Note (append to one daily file) | Timestamp |
| Daily Note Size Limit | Create new file when Daily Note exceeds this size (KB) | 200 |

### Maintenance

| Setting | Description | Default |
|---------|-------------|---------|
| Auto Maintenance | Run vault maintenance periodically | false |
| Interval (min) | Automatic maintenance interval | 60 |
| Exclude Folders | Folders to skip during scans (comma-separated) | — |
| Exclude File Patterns | Glob patterns for files to skip (comma-separated) | — |
| Exclude Tags | Notes with these tags are skipped (comma-separated) | — |
| Archive Folder | Target folder for archived notes | Archive |

### Privacy Rules

Add, remove, and toggle privacy rules in the Settings tab. Each rule has a name, type, pattern, and enabled toggle.

---

## Commands

| Command | Description |
|---------|-------------|
| Quick Ask | Ask AI a question (vault context included) |
| Organize Current Note | Classify and tag the active note with AI |
| Process Inbox | Batch-process notes in the Inbox folder |
| Run Maintenance | Scan the entire vault for issues |
| Scan this folder for maintenance | Scan only the right-clicked folder |
| Capture Clipboard | Save clipboard content as a new note |
| Open Maintenance Log | Show activity log in sidebar |
| Open Inbox Status | Show Inbox folder status in sidebar |

---

## Installation

### BRAT (Recommended for beta testing)

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin.
2. In BRAT settings, click **Add Beta Plugin**.
3. Enter: `dhwang0803-glitch/Noluma`
4. Enable **Knowledge Maintenance** in Community Plugins.
5. Configure your AI provider and API key in Settings.

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/dhwang0803-glitch/Noluma/releases).
2. Create `.obsidian/plugins/knowledge-maintenance/` in your vault folder.
3. Copy the 3 files into that directory.
4. Restart Obsidian or refresh in **Settings → Community Plugins**.
5. Enable **Knowledge Maintenance**.
6. Configure your AI provider and API key in Settings.

### Build from Source

```bash
git clone https://github.com/dhwang0803-glitch/Noluma.git
cd Noluma
npm install
npm run build
```

Copy the generated `main.js`, `manifest.json`, and `styles.css` to your vault's plugin directory.

### Mobile

The same 3 files go in `.obsidian/plugins/knowledge-maintenance/` on mobile.

- **With Obsidian Sync**: Install on desktop and it syncs automatically.
- **Manual**: Copy via file manager or USB.
  - Android: `Internal Storage/Documents/Obsidian/[Vault]/.obsidian/plugins/knowledge-maintenance/`
  - iOS: Files app → Obsidian → [Vault] → `.obsidian/plugins/knowledge-maintenance/`

---

## Architecture

Built on Clean Architecture principles. Dependencies always point inward (toward the domain).

```
domain/          ← Pure business logic (no external dependencies)
  models/        ← Note, PrivacyRule, OrganizeResult, MaintenanceAction
  values/        ← NotePath, TagName, Timestamp, Severity (branded types)
  errors/        ← Domain-specific error classes

application/     ← Use cases + port interfaces
  usecases/      ← QuickAskUseCase, RunMaintenanceUseCase, etc.
  ports/         ← AIProviderPort, VaultAccessPort, ConfigPort, etc.

adapters/        ← Port implementations (external library dependencies)
  ai/            ← OpenAIAdapter, GeminiAdapter, DynamicAIAdapter
  vault/         ← ObsidianVaultAdapter
  history/       ← FileHistoryAdapter
  search/        ← JsonSearchIndexAdapter

ui/              ← Obsidian UI components
  QuickAskModal, MaintenanceResultView, PluginSettingTab, etc.

i18n/            ← Internationalization (en, ko)

main.ts          ← Composition Root (wires all dependencies)
```

---

## Compatibility

- Obsidian **1.7.2** or later
- Desktop (Windows, macOS, Linux)
- Mobile (Android, iOS)
- AI Providers: OpenAI API, Google Gemini API

---

## Known Limitations

### AI Dependency

- **API key required**: Core features (Quick Ask, Note Organizer, Inbox Processing) require an OpenAI or Gemini API key. Without one, only maintenance scanning (orphan notes, broken links) is available.
- **API costs**: All AI calls consume tokens. High-frequency auto-maintenance or large batch processing may accumulate costs.
- **Network required**: AI features need internet connectivity. Maintenance scans work offline.

### Search Index

- Uses a JSON-based keyword index. Very large vaults (1000+ notes) may experience slower search.
- Semantic search is not supported — matching is keyword-based.

### Duplicate Detection

- Jaccard similarity may miss notes with similar meaning but different wording.
- Very short notes (a few words) may produce inaccurate similarity scores.

### Mobile

- Background switching may interrupt in-progress AI calls.
- Clipboard capture is subject to mobile OS clipboard permission policies.

### Privacy

- Privacy rules control data sent by the plugin. Review your AI provider's (OpenAI, Google) data handling policies separately.
- Content redaction is regex-based — complex sensitive patterns need explicit rules.

---

## Development

```bash
npm run dev        # Development mode (watch)
npm run build      # Production build
npm run lint       # ESLint check
npm run test       # Run tests (vitest)
npm run test:watch # Watch mode tests
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.
