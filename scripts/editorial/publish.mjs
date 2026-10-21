#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  applyPrepared,
  prepareChange,
  preconditions,
  validateRepository,
} from './publishing.mjs';

try {
  const args = process.argv.slice(2),
    mode = args.shift() || 'check';
  if (mode === 'check' || mode === 'inspect') {
    if (args.length)
      throw Error('check/inspect do not accept publication inputs');
    const r = validateRepository(process.cwd());
    console.log(
      JSON.stringify(
        mode === 'inspect'
          ? {
              expected: preconditions(r),
              lead: r.placement.lead,
              carousel: r.placement.carousel,
              editions: r.manifest.editions,
            }
          : { valid: true, approvalId: r.last.id },
        null,
        2,
      ),
    );
  } else if (mode === 'apply') {
    const options = {};
    for (let i = 0; i < args.length; i++) {
      const key = args[i];
      if (key === '--write') {
        if (options.write) throw Error('Duplicate --write');
        options.write = true;
        continue;
      }
      if (
        !['--change', '--placement', '--culture'].includes(key) ||
        !args[i + 1] ||
        args[i + 1].startsWith('--')
      )
        throw Error(
          'Usage: apply --change approved.json --placement candidate.jsx [--culture candidate-culture.jsx] [--write]',
        );
      if (options[key]) throw Error('Duplicate ' + key);
      options[key] = args[++i];
    }
    if (!options['--change'] || !options['--placement'])
      throw Error(
        'An explicit approved change and authored placement candidate are required',
      );
    const read = (file) => readFileSync(path.resolve(file), 'utf8');
    const change = JSON.parse(read(options['--change']));
    const plan = prepareChange(
      process.cwd(),
      change,
      read(options['--placement']),
      options['--culture'] ? read(options['--culture']) : undefined,
    );
    console.log(
      JSON.stringify(
        applyPrepared(plan, { write: options.write === true }),
        null,
        2,
      ),
    );
  } else throw Error('Unknown mode: ' + mode);
} catch (error) {
  console.error('Editorial publication rejected:', error.message);
  process.exitCode = 1;
}
