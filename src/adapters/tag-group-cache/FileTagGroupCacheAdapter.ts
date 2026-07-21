import type { TagGroupCachePort, TagGroupCacheMeta, CachedTagGroup } from '../../application/ports/TagGroupCachePort';
import type { VaultAccessPort } from '../../application/ports/VaultAccessPort';
import { TAG_GROUPS_PATH } from '../../constants';

const SCHEMA_VERSION = 2;

interface StoredData {
  meta: TagGroupCacheMeta | null;
  groups: CachedTagGroup[];
  processedTags: string[];
}

export class FileTagGroupCacheAdapter implements TagGroupCachePort {
  private groups: CachedTagGroup[] = [];
  private processedTags = new Set<string>();
  private meta: TagGroupCacheMeta | null = null;
  private dirty = false;
  private writeLock: Promise<void> = Promise.resolve();

  constructor(private readonly vault: VaultAccessPort) {}

  private serialized<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.writeLock.then(fn, fn);
    this.writeLock = next.then(() => {}, () => {});
    return next;
  }

  async load(): Promise<void> {
    const raw = await this.vault.readFileRaw(TAG_GROUPS_PATH);
    if (!raw) return;

    try {
      const data = JSON.parse(raw) as StoredData;
      if (!Array.isArray(data.groups)) return;

      this.meta = data.meta ?? null;
      this.groups = data.groups;
      this.processedTags = new Set(data.processedTags ?? []);
    } catch {
      this.groups = [];
      this.processedTags.clear();
      this.meta = null;
    }
    this.dirty = false;
  }

  async flush(): Promise<void> {
    return this.serialized(async () => {
      if (!this.dirty) return;

      const data: StoredData = {
        meta: this.meta,
        groups: [...this.groups],
        processedTags: [...this.processedTags],
      };
      await this.vault.writeFileRaw(TAG_GROUPS_PATH, JSON.stringify(data));
      this.dirty = false;
    });
  }

  getGroups(): ReadonlyArray<CachedTagGroup> {
    return this.groups;
  }

  getProcessedTags(): ReadonlySet<string> {
    return this.processedTags;
  }

  setGroups(groups: ReadonlyArray<CachedTagGroup>, processedTags: ReadonlySet<string>): void {
    this.groups = [...groups];
    this.processedTags = new Set(processedTags);
    this.dirty = true;
  }

  getMeta(): TagGroupCacheMeta | null {
    return this.meta;
  }

  setMeta(meta: Omit<TagGroupCacheMeta, 'version'>): void {
    this.meta = { ...meta, version: SCHEMA_VERSION };
    this.dirty = true;
  }

  isCompatible(provider: string, model: string): boolean {
    if (!this.meta) return this.processedTags.size === 0;
    return this.meta.provider === provider && this.meta.model === model && this.meta.version === SCHEMA_VERSION;
  }

  async clear(): Promise<void> {
    this.groups = [];
    this.processedTags.clear();
    this.meta = null;
    this.dirty = false;
    await this.vault.writeFileRaw(TAG_GROUPS_PATH, JSON.stringify({ meta: null, groups: [], processedTags: [] }));
  }
}
