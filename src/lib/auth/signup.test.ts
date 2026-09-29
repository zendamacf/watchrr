import { afterEach, describe, expect, it } from 'vitest';
import { isSignupEnabled } from './signup';

describe('isSignupEnabled', () => {
  const previous = process.env.ALLOW_SIGNUP;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.ALLOW_SIGNUP;
    } else {
      process.env.ALLOW_SIGNUP = previous;
    }
  });

  it('defaults to enabled when ALLOW_SIGNUP is unset', () => {
    delete process.env.ALLOW_SIGNUP;
    expect(isSignupEnabled()).toBe(true);
  });

  it('disables signup for common false values', () => {
    for (const value of ['false', 'FALSE', '0', 'no', 'off']) {
      process.env.ALLOW_SIGNUP = value;
      expect(isSignupEnabled()).toBe(false);
    }
  });

  it('keeps signup enabled for other values', () => {
    process.env.ALLOW_SIGNUP = 'true';
    expect(isSignupEnabled()).toBe(true);
  });
});
