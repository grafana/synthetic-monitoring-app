import { RefinementCtx, ZodIssueCode } from 'zod';

import { extractImportStatement, extractOptionsExport, getProperty, parseScript } from './parser';

const MAX_SCRIPT_IN_KB = 128;

function hasK6Pragma(script: string): boolean {
  // Match patterns like: "use k6 >= v1.0.0", "use k6 > 0.52", etc.
  const pragmaPattern = /["']use\s+k6\s*[><=!]+\s*v?\d+/i;
  return pragmaPattern.test(script);
}

function hasK6ExtensionImports(script: string): boolean {
  // Match import statements that include k6/x/ paths
  const extensionPattern = /import\s+.*from\s*['"`][^'"`]*k6\/x\/[^'"`]*['"`]/i;
  return extensionPattern.test(script);
}

function validateScriptPragmasAndExtensions(script: string, context: RefinementCtx): void {
  if (hasK6Pragma(script)) {
    context.addIssue({
      code: ZodIssueCode.custom,
      message: 'Script contains a k6 version pragma which is not allowed. Please remove the "use k6" directive.',
    });
  }

  if (hasK6ExtensionImports(script)) {
    context.addIssue({
      code: ZodIssueCode.custom,
      message: 'Script imports k6 extensions which are not allowed. Please remove imports from k6/x/ paths.',
    });
  }
}

export const maxSizeValidation = (val: string, context: RefinementCtx) => {
  const textBlob = new Blob([val], { type: 'text/plain' });
  const sizeInBytes = textBlob.size;
  const sizeInKb = sizeInBytes / 1024;

  if (sizeInKb > MAX_SCRIPT_IN_KB) {
    return context.addIssue({
      code: ZodIssueCode.custom,
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
      code: ZodIssueCode.custom,
      message: 'Script does not export any options.',
    });
  }

  const hasChromium = getProperty(options, ['options', 'browser', 'type']) === 'chromium';
  if (!hasChromium) {
    return context.addIssue({
      code: ZodIssueCode.custom,
      message: 'Script must set the type to chromium in the browser options.',
    });
  }

  const hasInvalidDuration = getProperty(options, ['duration']) !== undefined;
  if (hasInvalidDuration) {
    return context.addIssue({
      code: ZodIssueCode.custom,
      message: "Script can't define a duration value for this check",
    });
  }

  const vus = getProperty(options, ['vus']);
  const hasInvaludVus = vus !== undefined && vus !== 1;
  if (hasInvaludVus) {
    return context.addIssue({
      code: ZodIssueCode.custom,
      message: "Script can't define vus > 1 for this check",
    });
  }

  const iterations = getProperty(options, ['iterations']);
  const hasInvalidIterations = iterations !== undefined && iterations !== 1;
  if (hasInvalidIterations) {
    return context.addIssue({
      code: ZodIssueCode.custom,
      message: "Script can't define iterations > 1 for this check",
    });
  }

  const browserImport = extractImportStatement(program);

  if (browserImport === null) {
    return context.addIssue({
      code: ZodIssueCode.custom,
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
      code: ZodIssueCode.custom,
      message: "Script must not import { browser } from 'k6/browser'",
    });
  }
}
