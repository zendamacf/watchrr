import { describe, expect, it } from 'vitest';
import { FINISHED_BONUS, SOURCE_WEIGHT, scoreRecommendation, sourceWeight } from './score';

describe('recommendation scoring', () => {
  it('weights an unfinished source at the base weight', () => {
    expect(sourceWeight({ finished: false })).toBe(SOURCE_WEIGHT);
  });

  it('adds a bonus for a finished source', () => {
    expect(sourceWeight({ finished: true })).toBe(SOURCE_WEIGHT + FINISHED_BONUS);
  });

  it('scores nothing without sources', () => {
    expect(scoreRecommendation([])).toBe(0);
  });

  it('sums the weight of each recommending source', () => {
    expect(scoreRecommendation([{ finished: false }, { finished: true }, { finished: false }])).toBe(
      3 * SOURCE_WEIGHT + FINISHED_BONUS,
    );
  });

  it('ranks a finished source above an unfinished one', () => {
    expect(scoreRecommendation([{ finished: true }])).toBeGreaterThan(scoreRecommendation([{ finished: false }]));
  });
});
