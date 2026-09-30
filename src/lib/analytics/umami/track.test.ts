import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trackUmamiEvent, trackUmamiPageView } from './track';

describe('umami track helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { umami: undefined });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('trackUmamiPageView sends a url payload', () => {
    const track = vi.fn();
    window.umami = { track };

    trackUmamiPageView('/movies');

    expect(track).toHaveBeenCalledOnce();
    const mapper = track.mock.calls[0]?.[0] as (props: Record<string, string>) => Record<string, string>;
    expect(mapper({ website: 'x' })).toEqual({ website: 'x', url: '/movies' });
  });

  it('trackUmamiEvent forwards event data', () => {
    const track = vi.fn();
    window.umami = { track };

    trackUmamiEvent('subscribe_show', { medium: 'tv' });

    expect(track).toHaveBeenCalledWith('subscribe_show', { medium: 'tv' });
  });

  it('no-ops when umami is not loaded', () => {
    expect(() => trackUmamiEvent('test')).not.toThrow();
    expect(() => trackUmamiPageView('/')).not.toThrow();
  });
});
