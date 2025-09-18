import { RefinementCtx, ZodIssueCode } from 'zod';

import { CheckFormValuesBase } from 'types';

import { extractImportStatement, extractOptionsExport, getProperty, parseScript } from './parser';

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

export function channelValidation(data: CheckFormValuesBase, ctx: RefinementCtx) {
  if (!data.channel) {
    return;
  }

  if (data.channelDisabled) {
    const errorMessage = 'The selected k6 channel is disabled. Please select a different one.';

    ctx.addIssue({
      path: ['channel'],
      message: errorMessage,
      code: ZodIssueCode.custom,
    });
  }
}
