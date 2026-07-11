import { HistoryPort, HistoryFilter } from '../../application/ports/HistoryPort';
import { HistoryEntry } from '../../domain/models/HistoryEntry';
import { VaultAccessPort } from '../../application/ports/VaultAccessPort';
import { NotePath } from '../../domain/values/NotePath';
import { Timestamp } from '../../domain/values/Timestamp';
import { HistoryEntryNotFoundError } from '../../domain/errors/DomainErrors';

/**
 * 파일 기반 변경 이력 어댑터.
 *
 * 이력을 Vault 내 JSON 파일로 관리한다.
 * 경로: .knowledge-maintenance/history/YYYY-MM.json (월별 분할)
 */
export class FileHistoryAdapter implements HistoryPort {
  private static readonly HISTORY_FOLDER = '.knowledge-maintenance/history';

  constructor(
    private readonly vault: VaultAccessPort,
  ) {}

  async record(entry: HistoryEntry): Promise<void> {
    const monthKey = this.getMonthKey(entry.timestamp);
    const filePath = `${FileHistoryAdapter.HISTORY_FOLDER}/${monthKey}.json` as NotePath;

    const existing = await this.loadMonthEntries(filePath);
    existing.push(entry);

    await this.vault.writeNote(filePath, JSON.stringify(existing, null, 2));
  }

  async list(filter?: HistoryFilter): Promise<ReadonlyArray<HistoryEntry>> {
    // Load all history files and apply filter
    const historyFiles = await this.vault.listNotes(FileHistoryAdapter.HISTORY_FOLDER);
    let allEntries: HistoryEntry[] = [];

    for (const filePath of historyFiles) {
      const entries = await this.loadMonthEntries(filePath);
      allEntries = allEntries.concat(entries);
    }

    // Apply filter
    let filtered = allEntries;
    if (filter?.since) {
      filtered = filtered.filter(e => (e.timestamp as number) >= (filter.since as number));
    }
    if (filter?.until) {
      filtered = filtered.filter(e => (e.timestamp as number) <= (filter.until as number));
    }
    if (filter?.action) {
      filtered = filtered.filter(e => e.action === filter.action);
    }

    // Sort by newest first
    filtered.sort((a, b) => (b.timestamp as number) - (a.timestamp as number));

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  async undo(entryId: string): Promise<void> {
    // Revert using previousContent from the entry
    const historyFiles = await this.vault.listNotes(FileHistoryAdapter.HISTORY_FOLDER);

    for (const filePath of historyFiles) {
      const entries = await this.loadMonthEntries(filePath);
      const target = entries.find(e => e.id === entryId);

      if (target && target.previousContent !== undefined) {
        await this.vault.writeNote(target.notePath, target.previousContent);
        return;
      }
    }

    throw new HistoryEntryNotFoundError(entryId);
  }

  private async loadMonthEntries(filePath: NotePath): Promise<HistoryEntry[]> {
    const note = await this.vault.readNote(filePath);
    if (!note) return [];

    try {
      return JSON.parse(note.content) as HistoryEntry[];
    } catch {
      console.warn(`[Knowledge Maintenance] 이력 파일 파싱 실패: ${filePath}`);
      return [];
    }
  }

  private getMonthKey(timestamp: Timestamp): string {
    const date = new Date(timestamp as number);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
