import { RefinementCtx } from 'zod';

import {
  collectObjectDeclarations,
  containsUnresolvableSpread,
  extractImportStatement,
  extractOptionsExport,
  getProperty,
  parseScript,
} from './parser';
import { K6_EXTENSION_MESSAGE, K6_PRAGMA_MESSAGE, validateK6Restrictions } from './rules';

const MAX_SCRIPT_IN_KB = 128;

export const UNRESOLVABLE_SPREAD_MESSAGE =
  'Script options contain a spread that can not be verified. Define the browser options inline, e.g. options: { browser: { type: "chromium" } }.';

function validateScriptPragmasAndExtensions(script: string, context: RefinementCtx): void {
  const validation = validateK6Restrictions(script, parseScript);

  if (validation.hasPragmas) {
    context.addIssue({
      code: 'custom',
      message: K6_PRAGMA_MESSAGE,
    });
  }

  if (validation.hasExtensions) {
    context.addIssue({
      code: 'custom',
      message: K6_EXTENSION_MESSAGE,
    });
  }
}

export const maxSizeValidation = (val: string, context: RefinementCtx) => {
  const textBlob = new Blob([val], { type: 'text/plain' });
  const sizeInBytes = textBlob.size;
  const sizeInKb = sizeInBytes / 1024;

  if (sizeInKb > MAX_SCRIPT_IN_KB) {
    return context.addIssue({
      code: 'custom',
      message: `Script is too big (${sizeInKb.toFixed(2)}kb). Maximum size is ${MAX_SCRIPT_IN_KB}kb.`,
    });
  }
};

export function validateBrowserScript(script: string, context: RefinementCtx) {
  validateScriptPragmasAndExtensions(script, context);

  const program = parseScript(script);

  if (program === null) {
    return context.addIssue({
      code: 'custom',
      message: 'Script contains syntax errors.',
    });
  }

  const options = extractOptionsExport(program);

  if (options === null) {
    return context.addIssue({
      code: 'custom',
      message: 'Script does not export any options.',
    });
  }

  // spreads of locally declared objects (e.g. `{ ...defaultOptions }`) are resolved so their
  // properties are validated too
  const declarations = collectObjectDeclarations(program);
  const hasChromium = getProperty(options, ['options', 'browser', 'type'], declarations) === 'chromium';
  if (!hasChromium) {
    // spreads we can't resolve statically (e.g. imported values) hide the browser options
    // from analysis, so explain why the requirement can't be verified
    if (containsUnresolvableSpread(options, declarations)) {
      return context.addIssue({
        code: 'custom',
        message: UNRESOLVABLE_SPREAD_MESSAGE,
      });
    }

    return context.addIssue({
      code: 'custom',
      message: 'Script must set the type to chromium in the browser options.',
    });
  }

  const hasInvalidDuration = getProperty(options, ['duration'], declarations) !== undefined;
  if (hasInvalidDuration) {
    return context.addIssue({
      code: 'custom',
      message: "Script can't define a duration value for this check",
    });
  }

  const vus = getProperty(options, ['vus'], declarations);
  const hasInvalidVus = vus !== undefined && vus !== 1;
  if (hasInvalidVus) {
    return context.addIssue({
      code: 'custom',
      message: "Script can't define vus > 1 for this check",
    });
  }

  const iterations = getProperty(options, ['iterations'], declarations);
  const hasInvalidIterations = iterations !== undefined && iterations !== 1;
  if (hasInvalidIterations) {
    return context.addIssue({
      code: 'custom',
      message: "Script can't define iterations > 1 for this check",
    });
  }

  const browserImport = extractImportStatement(program);

  if (browserImport === null) {
    return context.addIssue({
      code: 'custom',
      message: "Script must import { browser } from 'k6/browser'",
    });
  }
}

export function validateNonBrowserScript(script: string, context: RefinementCtx) {
  validateScriptPragmasAndExtensions(script, context);

  const program = parseScript(script);

  if (program === null) {
    return context.addIssue({
      code: 'custom',
      message: 'Script contains syntax errors.',
    });
  }
  const browserImport = extractImportStatement(program);

  if (browserImport !== null) {
    return context.addIssue({
      code: 'custom',
      message: "Script must not import { browser } from 'k6/browser'",
    });
  }
}
