import { z, ZodType } from 'zod';

import { BrowserSettings, CheckFormValuesBrowser, CheckType } from 'types';

import { maxSizeValidation, validateBrowserScript } from './script/validation';
import { BaseCheckSchema } from './BaseCheckSchema';

const BrowserSettingsSchema: ZodType<BrowserSettings> = z.object({
  script: z.string().min(1, `Script is required.`).superRefine(maxSizeValidation).superRefine(validateBrowserScript),
});

const BrowserSchemaValues = z.object({
  target: z.string().min(3, `Instance must be at least 3 characters long.`),
  checkType: z.literal(CheckType.Browser),
  settings: z.object({
    browser: BrowserSettingsSchema,
  }),
});

export const BrowserCheckSchema: ZodType<CheckFormValuesBrowser> = BaseCheckSchema.and(BrowserSchemaValues);
