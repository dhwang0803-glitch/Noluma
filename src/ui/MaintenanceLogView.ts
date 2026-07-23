import { ItemView, WorkspaceLeaf, Setting, Notice } from 'obsidian';
import { GetHistoryUseCase } from '../application/usecases/GetHistoryUseCase';
import { HistoryPort } from '../application/ports/HistoryPort';
import { HistoryEntry } from '../domain/models/HistoryEntry';
import { MAINTENANCE_LOG_VIEW_TYPE, HISTORY_CHANGED_EVENT } from '../constants';
import { t, formatDate } from '../i18n';
import { localizeError } from './localizeError';

export { MAINTENANCE_LOG_VIEW_TYPE };

export class MaintenanceLogView extends ItemView {
  private refreshTimer: number | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly getHistory: GetHistoryUseCase,
    private readonly historyPort: HistoryPort,
  ) {
    super(leaf);
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      this.refresh();
    }, 300);
  }

  getViewType(): string {
    return MAINTENANCE_LOG_VIEW_TYPE;
  }

  getDisplayText(): string {
    return t('log.viewTitle');
  }

  getIcon(): string {
    return 'wrench';
  }

  async onOpen(): Promise<void> {
    this.registerEvent(
      this.app.workspace.on(HISTORY_CHANGED_EVENT, () => this.scheduleRefresh()),
    );
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();

    new Setting(contentEl)
      .setName(t('log.title'))
      .addExtraButton(btn => btn
        .setIcon('refresh-cw')
        .setTooltip(t('log.refresh'))
        .onClick(() => this.refresh()),
      );

    const entries = await this.getHistory.execute({ limit: 50 });

    if (entries.length === 0) {
      contentEl.createEl('p', {
        text: t('log.empty'),
        cls: 'vaultend-empty',
      });
      return;
    }

    for (const entry of entries) {
      const setting = new Setting(contentEl);
      const time = formatDate(entry.timestamp as number);
      setting.setName(`[${time}] ${entry.action}`);
      setting.setDesc(this.formatDescription(entry));

      const canUndo = entry.previousContent !== undefined
        || (entry.action === 'archive' && entry.metadata?.archivedTo)
        || (entry.action === 'tag-merge' && Array.isArray(entry.metadata?.affectedFiles) && (entry.metadata!.affectedFiles as unknown[]).length > 0);
      if (canUndo) {
        setting.addButton(btn => btn
          .setButtonText(t('log.undo'))
          .setWarning()
          .onClick(async () => {
            try {
              await this.historyPort.undo(entry.id);
              new Notice(t('undo.success'));
              this.app.workspace.trigger(HISTORY_CHANGED_EVENT, entry.id);
            } catch (err) {
              new Notice(t('undo.failed', { error: localizeError(err) }));
            }
          }),
        );
      }
    }
  }

  private formatDescription(entry: HistoryEntry): string {
    const meta = entry.metadata ?? {};
    const path = entry.notePath as string;

    switch (entry.action) {
      case 'delete':
        return t('historyDesc.delete', { path });
      case 'create':
        return t('historyDesc.create', { name: path.replace(/\.md$/, '').split('/').pop() ?? path });
      case 'archive':
        if (meta.archivedTo) {
          const folder = String(meta.archivedTo).replace(/\/[^/]+$/, '');
          return t('historyDesc.archive', { path, folder });
        }
        return entry.description;
      case 'tag-merge':
        if (meta.keepTag && Array.isArray(meta.replacedTags)) {
          return t('historyDesc.tagMerge', {
            replacedTags: (meta.replacedTags as string[]).join(', '),
            keepTag: String(meta.keepTag),
            count: String(meta.mergedNoteCount ?? 0),
          });
        }
        return entry.description;
      default:
        return entry.description;
    }
  }

  async onClose(): Promise<void> {
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
    this.contentEl.empty();
  }
}
