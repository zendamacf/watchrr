import { describe, expect, it } from 'vitest';
import { DateFormat } from './dates';

describe('DateFormat', () => {
  it('defines display format strings', () => {
    expect(DateFormat.YMD).toBe('yyyy-LL-dd');
    expect(DateFormat.DMY).toBe('dd/LL/kkkk');
    expect(DateFormat.DOW_DMY).toBe('cccc dd/LL/kkkk');
  });
});
