import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseFlags } from '../src/flags.js';

describe('parseFlags', () => {
  it('handles quotes with spaces', () => {
    const res = parseFlags('--model "gpt 4" --quiet');
    assert.deepEqual(res, ['--model', 'gpt 4', '--quiet']);
  });
  it('handles single quotes', () => {
    const res = parseFlags("--opt 'hello world'");
    assert.deepEqual(res, ['--opt', 'hello world']);
  });
});
