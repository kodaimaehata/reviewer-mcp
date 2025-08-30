export function parseFlags(input: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inSingle = false;
  let inDouble = false;
  let esc = false;
  for (const ch of input) {
    if (esc) {
      cur += ch;
      esc = false;
      continue;
    }
    if (ch === '\\') {
      esc = true;
      continue;
    }
    if (inSingle) {
      if (ch === "'") {
        inSingle = false;
      } else {
        cur += ch;
      }
      continue;
    }
    if (inDouble) {
      if (ch === '"') {
        inDouble = false;
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (cur) {
        result.push(cur);
        cur = '';
      }
      continue;
    }
    cur += ch;
  }
  if (cur) result.push(cur);
  return result;
}
