import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { appendFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const sdk = process.env.COOPANION_ASAR_SDK;
assert(sdk?.includes('/Contents/Resources/app.asar/dsh'), 'Use only the inspected official Desktop SDK');
const anchor = new URL('file://' + join(sdk, 'package.json')).href;
registerHooks({ resolve(specifier, context, next) {
  const path = specifier.startsWith('file:') ? fileURLToPath(specifier) : specifier;
  const name = /(?:^|\/)@deepseek-ai\/([\w-]+)(?:\/|$)/.exec(path)?.[1];
  if (name && !/^dsh-client|^dsh-web|^dsh$/.test(name)) {
    const result = next('@deepseek-ai/' + name, { ...context, parentURL: anchor });
    const resolved = fileURLToPath(result.url);
    assert(resolved.startsWith(sdk), 'Desktop Host modules must resolve into the signed ASAR');
    if (process.env.COOPANION_ASAR_RESOLUTION_LOG) appendFileSync(process.env.COOPANION_ASAR_RESOLUTION_LOG, JSON.stringify({ name, sha256: createHash('sha256').update(readFileSync(resolved)).digest('hex') }) + '\n');
    return result;
  }
  return next(specifier, context);
} });
