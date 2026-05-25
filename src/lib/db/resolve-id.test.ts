import { describe, expect, it } from 'vitest';
import { isMediaIdParam, isUuid, parseLegacyId } from './resolve-id';

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

  describe('parseLegacyId', () => {
    it('parses positive integer strings', () => {
      expect(parseLegacyId('42')).toBe(42);
    });

    it('rejects non-numeric params', () => {
      expect(parseLegacyId('bad')).toBeUndefined();
      expect(parseLegacyId('12abc')).toBeUndefined();
    });
  });

  describe('isMediaIdParam', () => {
    it('accepts UUID or legacy numeric ids', () => {
      expect(isMediaIdParam('00000000-0000-4000-8000-000000000001')).toBe(true);
      expect(isMediaIdParam('7')).toBe(true);
      expect(isMediaIdParam('nope')).toBe(false);
    });
  });
});
