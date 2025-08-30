import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type Target = { file: string; path: string };
export type Reference = { file: string; path: string };

export type ReviewInput = {
  targets: Target[];
  reference: Reference[];
  previous_reviews?: Reference[];
  review_request: string;
  timeout_ms?: number;
  policy?: string | null;
};

export function buildPrompt(input: ReviewInput): string {
  const tmplPathOverride = process.env.REVIEWER_MCP_TEMPLATE_PATH;
  const tmplPath = tmplPathOverride ?? fileURLToPath(new URL('./prompt/template.txt', import.meta.url));
  const tmpl = readFileSync(tmplPath, 'utf8');
  const targets_json = JSON.stringify(input.targets, null, 2);
  const reference_json = JSON.stringify(input.reference, null, 2);
  const prevList = input.previous_reviews ?? [];
  const previous_reviews_objects: any[] = [];
  for (const p of prevList) {
    try {
      const raw = readFileSync(p.path, 'utf8');
      const obj = JSON.parse(raw);
      previous_reviews_objects.push({ file: p.file, path: p.path, review: obj });
    } catch {
      previous_reviews_objects.push({ file: p.file, path: p.path, review: null, error: 'unreadable_or_invalid_json' });
    }
  }
  const previous_reviews_json = JSON.stringify(previous_reviews_objects, null, 2);
  const follow_up_instructions = prevList.length > 0
    ? '前回レビュー（must_fixes と acceptance_checklist）に基づき、各指摘が解消済みかを厳密に確認し、未解消の場合は理由と改善指示を明確に示してください。新規の懸念点があれば suggestions に含めてください。出力はJSONのみです。'
    : '';
  return tmpl
    .replace('{{review_request}}', input.review_request)
    .replace('{{targets_json}}', targets_json)
    .replace('{{reference_json}}', reference_json)
    .replace('{{previous_reviews_json}}', previous_reviews_json)
    .replace('{{follow_up_instructions}}', follow_up_instructions);
}

export function extractJsonString(text: string): string | null {
  if (!text) return null;
  const raw = String(text);
  const trimmed = raw.trim();
  if (looksLikeJson(trimmed)) return trimmed;
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = fenceRegex.exec(raw)) !== null) {
    const candidate = m[1].trim();
    if (looksLikeJson(candidate)) return candidate;
  }
  const starts: number[] = [];
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '{' || ch === '[') starts.push(i);
  }
  for (const start of starts) {
    const candidate = extractBalancedFrom(raw, start);
    if (candidate && looksLikeJson(candidate)) return candidate;
  }
  return null;
}

function looksLikeJson(s: string): boolean {
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}

function extractBalancedFrom(src: string, start: number): string | null {
  const open = src[start];
  if (open !== '{' && open !== '[') return null;
  const closing = open === '{' ? '}' : ']';
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = false; continue; }
      continue;
    } else {
      if (ch === '"') { inStr = true; continue; }
      if (ch === '{' || ch === '[') {
        depth++;
      } else if (ch === '}' || ch === ']') {
        depth--;
        if (depth === 0) {
          const snippet = src.slice(start, i + 1).trim();
          return snippet;
        }
        if (depth < 0) return null;
      }
    }
  }
  return null;
}

export function execWithTimeout(cmd: string, args: string[], timeoutMs: number): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
    let stdout = '';
    let stderr = '';
    const t = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on('data', (d: Buffer) => (stdout += String(d)));
    child.stderr.on('data', (d: Buffer) => (stderr += String(d)));
    child.on('error', reject);
    child.on('close', (code: number | null) => {
      clearTimeout(t);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${cmd} exited with code ${code}: ${stderr}`));
      }
    });
  });
}

export function persistReview(obj: any) {
  try {
    const ts = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const name = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.json`;
    const path = join(process.cwd(), 'reviews', name);
    writeFileSync(path, JSON.stringify(obj, null, 2), 'utf8');
  } catch {
    // best-effort; ignore persistence errors
  }
}

