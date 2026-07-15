import { OrganizeNoteUseCase } from './OrganizeNoteUseCase';
import { VaultAccessPort } from '../ports/VaultAccessPort';
import { ConfigPort } from '../ports/ConfigPort';
import { HistoryPort } from '../ports/HistoryPort';
import { ClockPort } from '../ports/ClockPort';
import { OrganizeResult } from '../../domain/models/OrganizeModels';
import { NotePath } from '../../domain/values/NotePath';

export interface OrganizeFolderProgressInfo {
  readonly current: number;
  readonly total: number;
  readonly currentNotePath: NotePath;
}

export type OrganizeFolderProgressCallback = (info: OrganizeFolderProgressInfo) => void;

export interface OrganizeFolderOptions {
  readonly onProgress?: OrganizeFolderProgressCallback;
  readonly signal?: AbortSignal;
  readonly folder?: string;
}

export interface OrganizeFolderResult {
  readonly processedCount: number;
  readonly skippedCount: number;
  readonly results: ReadonlyArray<OrganizeResult>;
  readonly errors: ReadonlyArray<{ path: NotePath; error: string }>;
  readonly cancelled?: boolean;
}

export class OrganizeFolderUseCase {
  constructor(
    private readonly organizeNote: OrganizeNoteUseCase,
    private readonly vault: VaultAccessPort,
    private readonly config: ConfigPort,
    private readonly history: HistoryPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(options?: OrganizeFolderOptions): Promise<OrganizeFolderResult> {
    const settings = await this.config.getSettings();
    const rawFolder = options?.folder ?? settings.captureFolder;
    const targetFolder = rawFolder === '/' ? undefined : rawFolder;

    const allNotes = await this.vault.listNotes(targetFolder);
    const unprocessedNotes = [];

    for (const notePath of allNotes) {
      const note = await this.vault.readNote(notePath);
      if (note && !note.metadata.isProcessed) {
        unprocessedNotes.push(notePath);
      }
    }

    const results: OrganizeResult[] = [];
    const errors: Array<{ path: NotePath; error: string }> = [];
    let cancelled = false;

    for (let i = 0; i < unprocessedNotes.length; i++) {
      if (options?.signal?.aborted) {
        cancelled = true;
        break;
      }

      const notePath = unprocessedNotes[i];
      options?.onProgress?.({
        current: i + 1,
        total: unprocessedNotes.length,
        currentNotePath: notePath,
      });

      try {
        const result = await this.organizeNote.execute(
          notePath,
          settings.autoApplyOrganize,
        );
        results.push(result);

        const stillExists = await this.vault.exists(notePath);
        if (stillExists) {
          await this.vault.updateFrontmatter(notePath, { processed: true });
        }
      } catch (err) {
        errors.push({
          path: notePath,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return {
      processedCount: results.length,
      skippedCount: allNotes.length - unprocessedNotes.length,
      results,
      errors,
      cancelled,
    };
  }
}
