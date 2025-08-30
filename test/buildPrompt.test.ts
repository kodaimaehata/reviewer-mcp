import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildPrompt } from '../src/review.js';

describe('buildPrompt', () => {
  it('replaces placeholders', () => {
    const tmpl = 'Req: {{review_request}}\nTargets: {{targets_json}}\nRef: {{reference_json}}\nPrev: {{previous_reviews_json}}\nFollow: {{follow_up_instructions}}';
    const file = join(tmpdir(), 'tmpl.txt');
    writeFileSync(file, tmpl, 'utf8');
    const envBackup = process.env.REVIEWER_MCP_TEMPLATE_PATH;
    process.env.REVIEWER_MCP_TEMPLATE_PATH = file;
    const prompt = buildPrompt({
      targets: [{ file: 'f', path: 'p' }],
      reference: [],
      review_request: 'rr'
    } as any);
    process.env.REVIEWER_MCP_TEMPLATE_PATH = envBackup;
    assert(prompt.includes('Req: rr'));
    assert(prompt.includes('Targets: [\n  {\n    "file": "f",\n    "path": "p"\n  }\n]'));
    assert(prompt.includes('Ref: []'));
  });
});
