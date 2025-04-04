import { z, ZodType } from 'zod';

import { BrowserSettings, CheckFormValuesBrowser, CheckType } from 'types';

import { maxSizeValidation, validateBrowserScript } from './script/validation';
import { baseCheckSchema } from './BaseCheckSchema';

const browserSettingsSchema: ZodType<BrowserSettings> = z.object({
  script: z.string().min(1, `Script is required.`).superRefine(maxSizeValidation).superRefine(validateBrowserScript),
});

const browserSchemaValues = z.object({
  target: z.string().min(3, `Instance must be at least 3 characters long.`),
  checkType: z.literal(CheckType.Browser),
  settings: z.object({
    browser: browserSettingsSchema,
  }),
});

export const browserCheckSchema: ZodType<CheckFormValuesBrowser> = baseCheckSchema.and(browserSchemaValues);
