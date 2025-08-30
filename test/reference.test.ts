import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReviewInput } from '../src/review.js';

describe('normalizeReviewInput', () => {
  it('defaults reference to []', () => {
    const input: any = { targets: [], review_request: 'r' };
    normalizeReviewInput(input);
    assert.deepEqual(input.reference, []);
  });
});
