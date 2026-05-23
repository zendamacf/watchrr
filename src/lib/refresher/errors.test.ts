import { describe, expect, it } from 'vitest';
import { RefresherError, ResourceNotFound } from './errors';

describe('refresher errors', () => {
  it('RefresherError sets name and extends Error', () => {
    const error = new RefresherError();
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RefresherError);
    expect(error.name).toBe('RefresherError');
  });

  it('ResourceNotFound extends RefresherError', () => {
    const error = new ResourceNotFound();
    expect(error).toBeInstanceOf(RefresherError);
    expect(error).toBeInstanceOf(ResourceNotFound);
    expect(error.name).toBe('ResourceNotFound');
  });
});
