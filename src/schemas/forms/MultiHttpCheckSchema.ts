import { HttpTargetSchema } from 'schemas/general/HttpTarget';
import { LabelsSchema } from 'schemas/general/Label';
import { z, ZodType } from 'zod';

import {
  CheckFormValuesMultiHttp,
  CheckType,
  HttpMethod,
  MultiHttpAssertionType,
  MultiHttpEntryFormValues,
  MultiHttpSettingsFormValues,
} from 'types';
import {
  Assertion,
  AssertionConditionVariant,
  AssertionSubjectVariant,
  MultiHttpVariable,
  RequestProps,
} from 'components/MultiHttp/MultiHttpTypes';

import { BaseCheckSchema } from './BaseCheckSchema';

const MultiHttpRequestSchema: ZodType<RequestProps> = z.object({
  method: z.nativeEnum(HttpMethod),
  url: HttpTargetSchema,
  body: z
    .object({
      contentType: z.string(),
      contentEncoding: z.string().optional(),
      payload: z.string(),
    })
    .optional(),
  headers: LabelsSchema,
  queryFields: LabelsSchema,
  postData: z
    .object({
      mimeType: z.string(),
      text: z.string(),
    })
    .optional(),
});

const MultiHttpAssertionSchema: ZodType<Assertion> = z.object({
  condition: z.nativeEnum(AssertionConditionVariant).optional(),
  expression: z.string().optional(),
  subject: z.nativeEnum(AssertionSubjectVariant).optional(),
  type: z.nativeEnum(MultiHttpAssertionType),
  value: z.string().optional(),
});

const MultiHttpVariablesSchema: ZodType<MultiHttpVariable> = z.object({
  attribute: z.string().optional(),
  expression: z.string(),
  name: z.string(),
  type: z.number(),
});

const MultiHttpEntriesSchema: ZodType<MultiHttpEntryFormValues> = z.object({
  checks: z.array(MultiHttpAssertionSchema).optional(),
  request: MultiHttpRequestSchema,
  variables: z.array(MultiHttpVariablesSchema).optional(),
});

const MultiHttpSettingsSchema: ZodType<MultiHttpSettingsFormValues> = z.object({
  entries: z.array(MultiHttpEntriesSchema),
});

const MultiHttpSchemaValues = z.object({
  checkType: z.literal(CheckType.MULTI_HTTP),
  settings: z.object({
    multihttp: MultiHttpSettingsSchema,
  }),
});

export const MultiHttpCheckSchema: ZodType<CheckFormValuesMultiHttp> = BaseCheckSchema.and(MultiHttpSchemaValues);
