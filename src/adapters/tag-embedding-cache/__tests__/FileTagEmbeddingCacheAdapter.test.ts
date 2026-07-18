import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileTagEmbeddingCacheAdapter } from '../FileTagEmbeddingCacheAdapter';
import { createMockVault } from '../../../test-utils/mock-ports';
import type { VaultAccessPort } from '../../../application/ports/VaultAccessPort';

function vec(values: number[]): Float32Array {
  return new Float32Array(values);
}

describe('FileTagEmbeddingCacheAdapter', () => {
  let vault: VaultAccessPort;
  let adapter: FileTagEmbeddingCacheAdapter;

  beforeEach(() => {
    vault = createMockVault();
    adapter = new FileTagEmbeddingCacheAdapter(vault);
  });

  describe('put + get', () => {
    it('stores and retrieves a vector', () => {
      adapter.setMeta({ provider: 'openai', dimension: 3 });
      adapter.put('#typescript', vec([1, 2, 3]));

      const result = adapter.get('#typescript');
      expect(result).toEqual(vec([1, 2, 3]));
    });

    it('returns undefined for missing tag', () => {
      expect(adapter.get('#missing')).toBeUndefined();
    });
  });

  describe('putMany + getMany', () => {
    it('batch stores and retrieves vectors', () => {
      adapter.setMeta({ provider: 'openai', dimension: 2 });
      adapter.putMany([
        { tag: '#a', vector: vec([1, 0]) },
        { tag: '#b', vector: vec([0, 1]) },
      ]);

      const result = adapter.getMany(['#a', '#b', '#c']);
      expect(result.size).toBe(2);
      expect(result.get('#a')).toEqual(vec([1, 0]));
      expect(result.get('#b')).toEqual(vec([0, 1]));
      expect(result.has('#c')).toBe(false);
    });

    it('empty putMany does not mark dirty', async () => {
      adapter.setMeta({ provider: 'openai', dimension: 2 });
      await adapter.flush();
      vi.mocked(vault.writeFileRaw).mockClear();

      adapter.putMany([]);
      await adapter.flush();
      expect(vault.writeFileRaw).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('removes a tag entry', () => {
      adapter.setMeta({ provider: 'openai', dimension: 2 });
      adapter.put('#a', vec([1, 0]));
      adapter.delete('#a');

      expect(adapter.get('#a')).toBeUndefined();
      expect(adapter.size()).toBe(0);
    });

    it('no-op for non-existent tag', () => {
      adapter.delete('#nonexistent');
      expect(adapter.size()).toBe(0);
    });
  });

  describe('retainOnly', () => {
    it('removes tags not in the valid set', () => {
      adapter.setMeta({ provider: 'openai', dimension: 2 });
      adapter.putMany([
        { tag: '#keep1', vector: vec([1, 0]) },
        { tag: '#keep2', vector: vec([0, 1]) },
        { tag: '#stale', vector: vec([1, 1]) },
      ]);

      adapter.retainOnly(['#keep1', '#keep2']);

      expect(adapter.get('#keep1')).toBeDefined();
      expect(adapter.get('#keep2')).toBeDefined();
      expect(adapter.get('#stale')).toBeUndefined();
      expect(adapter.size()).toBe(2);
    });
  });

  describe('flush', () => {
    it('skips write when not dirty', async () => {
      await adapter.flush();
      expect(vault.writeFileRaw).not.toHaveBeenCalled();
    });

    it('skips write when no meta set', async () => {
      adapter.put('#tag', vec([1]));
      await adapter.flush();
      expect(vault.writeFileRaw).not.toHaveBeenCalled();
    });

    it('writes when dirty with meta', async () => {
      adapter.setMeta({ provider: 'openai', dimension: 2 });
      adapter.put('#tag', vec([1, 0]));
      await adapter.flush();

      expect(vault.writeFileRaw).toHaveBeenCalledOnce();
      const [path, content] = vi.mocked(vault.writeFileRaw).mock.calls[0];
      expect(path).toBe('.vaultend/tag-embeddings.json');

      const parsed = JSON.parse(content);
      expect(parsed.meta.provider).toBe('openai');
      expect(parsed.meta.dimension).toBe(2);
      expect(parsed.entries).toHaveLength(1);
      expect(parsed.entries[0].tag).toBe('#tag');
    });

    it('clears dirty flag after write', async () => {
      adapter.setMeta({ provider: 'openai', dimension: 2 });
      adapter.put('#tag', vec([1, 0]));
      await adapter.flush();
      vi.mocked(vault.writeFileRaw).mockClear();

      await adapter.flush();
      expect(vault.writeFileRaw).not.toHaveBeenCalled();
    });
  });

  describe('load + roundtrip', () => {
    it('loads previously flushed data', async () => {
      adapter.setMeta({ provider: 'gemini', dimension: 3 });
      adapter.putMany([
        { tag: '#x', vector: vec([0.5, 1.0, -0.3]) },
        { tag: '#y', vector: vec([1.0, 0.0, 0.7]) },
      ]);
      await adapter.flush();

      const savedContent = vi.mocked(vault.writeFileRaw).mock.calls[0][1];

      const adapter2 = new FileTagEmbeddingCacheAdapter(
        createMockVault({ readFileRaw: vi.fn().mockResolvedValue(savedContent) }),
      );
      await adapter2.load();

      expect(adapter2.size()).toBe(2);
      expect(adapter2.getMeta()?.provider).toBe('gemini');
      expect(adapter2.getMeta()?.dimension).toBe(3);

      const xVec = adapter2.get('#x');
      expect(xVec).toBeDefined();
      expect(xVec![0]).toBeCloseTo(0.5);
      expect(xVec![1]).toBeCloseTo(1.0);
      expect(xVec![2]).toBeCloseTo(-0.3);
    });
  });

  describe('load graceful degradation', () => {
    it('handles missing file', async () => {
      vi.mocked(vault.readFileRaw).mockResolvedValue(null);
      await adapter.load();
      expect(adapter.size()).toBe(0);
      expect(adapter.getMeta()).toBeNull();
    });

    it('handles corrupt JSON', async () => {
      vi.mocked(vault.readFileRaw).mockResolvedValue('not json {{{');
      await adapter.load();
      expect(adapter.size()).toBe(0);
    });

    it('handles missing entries array', async () => {
      vi.mocked(vault.readFileRaw).mockResolvedValue('{"meta": {"provider":"x","dimension":1,"version":1}}');
      await adapter.load();
      expect(adapter.size()).toBe(0);
    });
  });

  describe('isCompatible', () => {
    it('returns false when no meta', () => {
      expect(adapter.isCompatible('openai', 1536)).toBe(false);
    });

    it('returns true for matching provider + dimension', () => {
      adapter.setMeta({ provider: 'openai', dimension: 1536 });
      expect(adapter.isCompatible('openai', 1536)).toBe(true);
    });

    it('returns false for different provider', () => {
      adapter.setMeta({ provider: 'openai', dimension: 1536 });
      expect(adapter.isCompatible('gemini', 1536)).toBe(false);
    });

    it('returns false for different dimension', () => {
      adapter.setMeta({ provider: 'openai', dimension: 1536 });
      expect(adapter.isCompatible('openai', 768)).toBe(false);
    });

    it('returns true when model matches', () => {
      adapter.setMeta({ provider: 'openai', dimension: 1536, model: 'text-embedding-3-small' });
      expect(adapter.isCompatible('openai', 1536, 'text-embedding-3-small')).toBe(true);
    });

    it('returns false when model differs', () => {
      adapter.setMeta({ provider: 'openai', dimension: 1536, model: 'text-embedding-3-small' });
      expect(adapter.isCompatible('openai', 1536, 'text-embedding-3-large')).toBe(false);
    });

    it('returns false when meta has no model but caller passes model', () => {
      adapter.setMeta({ provider: 'openai', dimension: 1536 });
      expect(adapter.isCompatible('openai', 1536, 'text-embedding-3-small')).toBe(false);
    });

    it('returns true when no model specified by caller', () => {
      adapter.setMeta({ provider: 'openai', dimension: 1536, model: 'text-embedding-3-small' });
      expect(adapter.isCompatible('openai', 1536)).toBe(true);
    });
  });

  describe('clear', () => {
    it('resets all state and writes empty file', async () => {
      adapter.setMeta({ provider: 'openai', dimension: 2 });
      adapter.put('#tag', vec([1, 0]));
      await adapter.clear();

      expect(adapter.size()).toBe(0);
      expect(adapter.getMeta()).toBeNull();
      expect(vault.writeFileRaw).toHaveBeenCalled();
    });
  });

  describe('size', () => {
    it('returns 0 for empty cache', () => {
      expect(adapter.size()).toBe(0);
    });

    it('returns correct count', () => {
      adapter.put('#a', vec([1]));
      adapter.put('#b', vec([2]));
      expect(adapter.size()).toBe(2);
    });
  });

  describe('serialized writes', () => {
    it('concurrent flushes coalesce — no data loss', async () => {
      adapter.setMeta({ provider: 'openai', dimension: 1 });
      adapter.put('#a', vec([1]));
      const p1 = adapter.flush();

      adapter.put('#b', vec([2]));
      const p2 = adapter.flush();

      await Promise.all([p1, p2]);

      // First flush runs as microtask, sees both #a and #b already in cache
      // Second flush sees dirty=false → skips. This is correct coalescing.
      expect(vault.writeFileRaw).toHaveBeenCalledTimes(1);
      const written = JSON.parse(vi.mocked(vault.writeFileRaw).mock.calls[0][1]);
      expect(written.entries).toHaveLength(2);
      const tags = written.entries.map((e: { tag: string }) => e.tag).sort();
      expect(tags).toEqual(['#a', '#b']);
    });
  });
});
