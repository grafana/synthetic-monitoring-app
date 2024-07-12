import { z, ZodType } from 'zod';

import { CheckFormValuesBrowser, CheckType } from 'types';

import { BaseCheckSchema } from './BaseCheckSchema';
import { ScriptedSettingsSchema } from './ScriptedCheckSchema';

const BrowserSchemaValues = z.object({
  target: z.string().min(3, `Instance must be at lesat 3 characters long.`),
  checkType: z.literal(CheckType.Browser),
  settings: z.object({
    browser: ScriptedSettingsSchema,
  }),
});

export const BrowserCheckSchema: ZodType<CheckFormValuesBrowser> = BaseCheckSchema.and(BrowserSchemaValues);
