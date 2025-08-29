import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCursorReview, type ReviewInput } from './cursor.js';

// MCP SDK
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  ListToolsResultSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

// Resolve schema JSON relative to this file, allowing env override
const schemaPathOverride = process.env.REVIEWER_MCP_SCHEMA_PATH;
const schemaFilePath = schemaPathOverride
  ? schemaPathOverride
  : fileURLToPath(new URL('./schemas/cursor.review.input.schema.json', import.meta.url));
const inputSchema = JSON.parse(readFileSync(schemaFilePath, 'utf8'));

type Targets = { file: string; path: string }[];
type Refs = { file: string; path: string }[];

function validateTargets(targets: Targets) {
  for (const t of targets) {
    if (!existsSync(t.path)) {
      throw new Error(`Target path not found: ${t.path}`);
    }
  }
}

function validateRefs(name: string, refs: Refs | undefined) {
  if (!refs) return;
  for (const r of refs) {
    if (!existsSync(r.path)) {
      throw new Error(`${name} path not found: ${r.path}`);
    }
  }
}

async function main() {
  const server = new Server(
    { name: 'cursor-reviewer', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  // SDK v1.17.x: register tools via setRequestHandler for tools/list and tools/call
  server.setRequestHandler(ListToolsRequestSchema, async (_req: any) => {
    return ListToolsResultSchema.parse({
      tools: [
        {
          name: 'cursor.review',
          title: 'Run review via Cursor (GPT‑5)',
          description: 'Review deliverables via Cursor CLI (GPT‑5) and return review JSON only.',
          inputSchema
        }
      ]
    });
  });

  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    const { name, arguments: args } = request.params ?? {};
    if (name !== 'cursor.review') {
      throw new Error(`Unknown tool: ${String(name)}`);
    }

    const input = args as ReviewInput;
    if (!input || !Array.isArray(input.targets) || typeof input.review_request !== 'string') {
      throw new Error('Invalid input: missing required fields');
    }
    validateTargets(input.targets);
    validateRefs('reference', input.reference);
    validateRefs('previous_reviews', input.previous_reviews);

    const review = await runCursorReview(input);
    const text = typeof review === 'string' ? review : JSON.stringify(review);
    return {
      content: [
        {
          type: 'text',
          text
        }
      ]
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
