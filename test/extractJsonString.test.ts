import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractJsonString } from '../src/review.js';

describe('extractJsonString', () => {
  it('extracts json within fences', () => {
    const text = '```json\n{"a":1}\n```';
    assert.equal(extractJsonString(text), '{"a":1}');
  });
});
