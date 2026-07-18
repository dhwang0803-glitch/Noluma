export interface TagEmbeddingCacheMeta {
  readonly provider: string;
  readonly dimension: number;
  readonly version: number;
}

export interface TagEmbeddingCachePort {
  load(): Promise<void>;
  flush(): Promise<void>;
  get(tag: string): Float32Array | undefined;
  getMany(tags: ReadonlyArray<string>): Map<string, Float32Array>;
  put(tag: string, vector: Float32Array): void;
  putMany(entries: ReadonlyArray<{ tag: string; vector: Float32Array }>): void;
  delete(tag: string): void;
  retainOnly(validTags: ReadonlyArray<string>): void;
  getMeta(): TagEmbeddingCacheMeta | null;
  setMeta(meta: Pick<TagEmbeddingCacheMeta, 'provider' | 'dimension'>): void;
  isCompatible(provider: string, dimension: number): boolean;
  clear(): Promise<void>;
  size(): number;
}
