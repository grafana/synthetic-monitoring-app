import { z, ZodType } from 'zod';

import { CheckFormValuesScripted, CheckType, ScriptedSettings } from 'types';

import { BaseCheckSchema } from './BaseCheckSchema';

const MAX_SCRIPT_IN_KB = 128;

/** Important: this schema is also used in `BrowserCheckSchema.ts`
 *  If you change this schema, make sure to update the other file as well (if they start to diverge).
 * */
export const ScriptedSettingsSchema: ZodType<ScriptedSettings> = z.object({
  script: z
    .string()
    .min(1, `Script is required.`)
    .superRefine((val, ctx) => {
      const textBlob = new Blob([val], { type: 'text/plain' });
      const sizeInBytes = textBlob.size;
      const sizeInKb = sizeInBytes / 1024;

      if (sizeInKb > MAX_SCRIPT_IN_KB) {
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Script is too big (${sizeInKb.toFixed(2)}kb). Maximum size is ${MAX_SCRIPT_IN_KB}kb.`,
        });
      }
    }),
});

const ScriptedSchemaValues = z.object({
  target: z.string().min(3, `Instance must be at lesat 3 characters long.`),
  checkType: z.literal(CheckType.Scripted),
  settings: z.object({
    scripted: ScriptedSettingsSchema,
  }),
});

export const ScriptedCheckSchema: ZodType<CheckFormValuesScripted> = BaseCheckSchema.and(ScriptedSchemaValues);
