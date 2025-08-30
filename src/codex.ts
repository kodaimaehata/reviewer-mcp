import {
  buildPrompt,
  extractJsonString,
  execWithTimeout,
  persistReview,
  type ReviewInput
} from './review.js';
import { parseFlags } from './flags.js';

export async function runCodexReview(input: ReviewInput): Promise<any> {
  const prompt = buildPrompt(input);
  const timeout = input.timeout_ms ?? 1_800_000; // 30m default

  try {
    return await callCodexAndParse(prompt, timeout);
  } catch (_) {
    const retryPrompt = `${prompt}\n\n重要: 必ずJSONのみを返し、説明文やコードフェンスは含めないこと。`;
    return await callCodexAndParse(retryPrompt, timeout);
  }
}

async function callCodexAndParse(prompt: string, timeoutMs: number): Promise<any> {
  const allowPlainFallback = process.env.REVIEWER_MCP_ALLOW_PLAINTEXT_FALLBACK === '1' ||
    process.env.REVIEWER_MCP_ALLOW_PLAINTEXT_FALLBACK === 'true';
  const bin = process.env.REVIEWER_MCP_CODEX_BIN || 'codex';
  const flags = parseFlags(process.env.REVIEWER_MCP_CODEX_FLAGS || '');
  const args = ['exec', ...flags, prompt];

  let stdout: string;
  try {
    ({ stdout } = await execWithTimeout(bin, args, timeoutMs));
  } catch (e: any) {
    if (e && (e.code === 'ENOENT' || /ENOENT/.test(e.message))) {
      throw new Error(`Codex CLI not found: set REVIEWER_MCP_CODEX_BIN or install 'codex'.`);
    }
    throw e;
  }

  try {
    const extracted = extractJsonString(stdout);
    if (!extracted) {
      if (allowPlainFallback) {
        return stdout.trim();
      }
      throw new Error('Could not locate JSON in Codex output');
    }
    const reviewObj = JSON.parse(extracted);
    persistReview(reviewObj);
    return reviewObj;
  } catch (e) {
    if (allowPlainFallback) {
      return stdout.trim();
    }
    throw new Error(`Review JSON parse failed: ${(e as Error).message}`);
  }
}
