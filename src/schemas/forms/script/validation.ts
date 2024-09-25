import { RefinementCtx, ZodIssueCode } from 'zod';

import {
  checkForChromium,
  extractImportStatement,
  extractOptionsExport,
  hasInvalidProperties,
  parseScript,
} from './parser';

const MAX_SCRIPT_IN_KB = 128;

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

  if (!checkForChromium(options)) {
    return context.addIssue({
      code: ZodIssueCode.custom,
      message: 'Script must set the type to chromium in the browser options.',
    });
  }

  if (hasInvalidProperties(options)) {
    return context.addIssue({
      code: ZodIssueCode.custom,
      message: "Script can't define vus, duration or iteration values for this check",
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
