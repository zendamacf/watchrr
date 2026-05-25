import { describe, expect, it } from 'vitest';
import { isUuid } from './resolve-id';

describe('resolve-id', () => {
  describe('isUuid', () => {
    it('accepts lowercase UUIDs', () => {
      expect(isUuid('00000000-0000-4000-8000-000000000001')).toBe(true);
    });

    it('rejects non-UUID strings', () => {
      expect(isUuid('bad')).toBe(false);
      expect(isUuid('42')).toBe(false);
    });
  });
});
