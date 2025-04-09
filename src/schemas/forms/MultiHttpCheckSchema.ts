import { frequencySchema } from 'schemas/general/Frequency';
import { headersSchema } from 'schemas/general/Header';
import { httpTargetSchema } from 'schemas/general/HttpTarget';
import { queryParamsSchema } from 'schemas/general/QueryParam';
import { timeoutSchema } from 'schemas/general/Timeout';
import { z, ZodType } from 'zod';

import {
  CheckFormValuesMultiHttp,
  CheckType,
  HttpMethod,
  MultiHttpAssertionType,
  MultiHttpEntryFormValues,
  MultiHttpSettingsFormValues,
} from 'types';
import { ONE_MINUTE_IN_MS, ONE_SECOND_IN_MS } from 'utils.constants';
import {
  Assertion,
  AssertionConditionVariant,
  AssertionJsonPath,
  AssertionJsonPathValue,
  AssertionRegex,
  AssertionSubjectVariant,
  AssertionText,
  MultiHttpVariable,
  RequestProps,
} from 'components/MultiHttp/MultiHttpTypes';

import { baseCheckSchema } from './BaseCheckSchema';

export const MIN_FREQUENCY_MULTI_HTTP = ONE_MINUTE_IN_MS;
export const MIN_TIMEOUT_MULTI_HTTP = ONE_SECOND_IN_MS * 5;
export const MAX_TIMEOUT_MULTI_HTTP = ONE_MINUTE_IN_MS * 3;

const multiHttpRequestSchema: ZodType<RequestProps> = z.object({
  method: z.nativeEnum(HttpMethod),
  url: httpTargetSchema,
  body: z
    .object({
      contentType: z.string(),
      contentEncoding: z.string().optional(),
      payload: z.string(),
    })
    .optional(),
  headers: headersSchema,
  queryFields: queryParamsSchema.optional(),
  postData: z
    .object({
      mimeType: z.string(),
      text: z.string(),
    })
    .optional(),
});

const assertionValueSchema = z
  .string({
    required_error: 'Value is required',
  })
  .min(1, { message: 'Value is required' });

const assertionExpressionSchema = z
  .string({
    required_error: 'Expression is required',
  })
  .min(1, { message: 'Expression is required' });

const multiHttpAssertionTextSchema: ZodType<AssertionText> = z.object({
  condition: z.nativeEnum(AssertionConditionVariant),
  subject: z.nativeEnum(AssertionSubjectVariant),
  type: z.literal(MultiHttpAssertionType.Text),
  value: assertionValueSchema,
});

const multiHttpAssertionJsonPathValueSchema: ZodType<AssertionJsonPathValue> = z.object({
  condition: z.nativeEnum(AssertionConditionVariant),
  expression: assertionExpressionSchema,
  type: z.literal(MultiHttpAssertionType.JSONPathValue),
  value: assertionValueSchema,
});

const multiHttpAssertionJsonPathSchema: ZodType<AssertionJsonPath> = z.object({
  expression: assertionExpressionSchema,
  type: z.literal(MultiHttpAssertionType.JSONPath),
});

const multiHttpAssertionRegexSchema: ZodType<AssertionRegex> = z.object({
  expression: assertionExpressionSchema,
  subject: z.nativeEnum(AssertionSubjectVariant),
  type: z.literal(MultiHttpAssertionType.Regex),
});

const multiHttpAssertionSchema: ZodType<Assertion> = z.union([
  multiHttpAssertionTextSchema,
  multiHttpAssertionJsonPathValueSchema,
  multiHttpAssertionJsonPathSchema,
  multiHttpAssertionRegexSchema,
]);

const multiHttpVariablesSchema: ZodType<MultiHttpVariable> = z.object({
  attribute: z.string().optional(),
  expression: z.string().min(1, { message: 'Expression is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
  type: z.number(),
});

const multiHttpEntriesSchema: ZodType<MultiHttpEntryFormValues> = z.object({
  checks: z.array(multiHttpAssertionSchema).optional(),
  request: multiHttpRequestSchema,
  variables: z.array(multiHttpVariablesSchema).optional(),
});

const multiHttpSettingsSchema: ZodType<MultiHttpSettingsFormValues> = z.object({
  entries: z.array(multiHttpEntriesSchema),
});

export const multiHttpCheckSchema: ZodType<CheckFormValuesMultiHttp> = baseCheckSchema
  .omit({
    frequency: true,
    timeout: true,
  })
  .and(
    z.object({
      checkType: z.literal(CheckType.MULTI_HTTP),
      settings: z.object({
        multihttp: multiHttpSettingsSchema,
      }),
      frequency: frequencySchema(MIN_FREQUENCY_MULTI_HTTP),
      timeout: timeoutSchema(MIN_TIMEOUT_MULTI_HTTP, MAX_TIMEOUT_MULTI_HTTP),
    })
  );
