import {
  buildPrompt,
  extractJsonString,
  execWithTimeout,
  persistReview,
  type ReviewInput
} from './review.js';

export async function runCursorReview(input: ReviewInput): Promise<any> {
  const prompt = buildPrompt(input);
  const timeout = input.timeout_ms ?? 1_800_000; // 30m default

  try {
    return await callCursorAndParse(prompt, timeout);
  } catch (_) {
    const retryPrompt = `${prompt}\n\n重要: 必ずJSONのみを返し、説明文やコードフェンスは含めないこと。`;
    return await callCursorAndParse(retryPrompt, timeout);
  }
}

async function callCursorAndParse(prompt: string, timeoutMs: number): Promise<any> {
  const allowPlainFallback =
    process.env.REVIEWER_MCP_ALLOW_PLAINTEXT_FALLBACK === '1' ||
    process.env.REVIEWER_MCP_ALLOW_PLAINTEXT_FALLBACK === 'true';
  let stdout: string;
  try {
    ({ stdout } = await execWithTimeout(
      'cursor-agent',
      ['-p', '--model', 'gpt-5', '--output-format', 'json', prompt],
      timeoutMs
    ));
  } catch (e: any) {
    if (e && (e.code === 'ENOENT' || /ENOENT/.test(e.message))) {
      throw new Error("Cursor CLI not found: install 'cursor-agent'.");
    }
    throw e;
  }

  // First parse: Cursor CLI JSON
  let top: any;
  try {
    top = JSON.parse(stdout.trim());
  } catch (e) {
    throw new Error(`Cursor output is not valid JSON: ${(e as Error).message}`);
  }
  if (typeof top !== 'object' || top === null) {
    throw new Error('Cursor JSON missing object');
  }
  if (typeof top.result !== 'string') {
    if (allowPlainFallback) {
      try {
        return JSON.stringify(top.result);
      } catch {
        return String(top.result);
      }
    }
    throw new Error('Cursor JSON missing string field "result"');
  }

  // Second parse: The actual review JSON inside `result`
  try {
    const extracted = extractJsonString(top.result);
    if (!extracted) {
      if (allowPlainFallback) {
        return top.result.trim();
      }
      throw new Error('Could not locate JSON in Cursor result');
    }
    const reviewObj = JSON.parse(extracted);
    persistReview(reviewObj);
    return reviewObj;
  } catch (e) {
    if (allowPlainFallback) {
      return top.result.trim();
    }
    throw new Error(`Review JSON parse failed: ${(e as Error).message}`);
  }
}
