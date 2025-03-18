import { FrequencySchema } from 'schemas/general/Frequency';
import { HeadersSchema } from 'schemas/general/Header';
import { HttpTargetSchema } from 'schemas/general/HttpTarget';
import { QueryParamsSchema } from 'schemas/general/QueryParam';
import { TimeoutSchema } from 'schemas/general/Timeout';
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

import { BaseCheckSchema } from './BaseCheckSchema';

export const MIN_FREQUENCY_MULTI_HTTP = ONE_MINUTE_IN_MS;
export const MIN_TIMEOUT_MULTI_HTTP = ONE_SECOND_IN_MS * 5;
export const MAX_TIMEOUT_MULTI_HTTP = ONE_MINUTE_IN_MS * 3;

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
  headers: HeadersSchema,
  queryFields: QueryParamsSchema.optional(),
  postData: z
    .object({
      mimeType: z.string(),
      text: z.string(),
    })
    .optional(),
});

const AssertionValueSchema = z
  .string({
    required_error: 'Value is required',
  })
  .min(1, { message: 'Value is required' });

const AssertionExpressionSchema = z
  .string({
    required_error: 'Expression is required',
  })
  .min(1, { message: 'Expression is required' });

const MultiHttpAssertionTextSchema: ZodType<AssertionText> = z.object({
  condition: z.nativeEnum(AssertionConditionVariant),
  subject: z.nativeEnum(AssertionSubjectVariant),
  type: z.literal(MultiHttpAssertionType.Text),
  value: AssertionValueSchema,
});

const MultiHttpAssertionJsonPathValueSchema: ZodType<AssertionJsonPathValue> = z.object({
  condition: z.nativeEnum(AssertionConditionVariant),
  expression: AssertionExpressionSchema,
  type: z.literal(MultiHttpAssertionType.JSONPathValue),
  value: AssertionValueSchema,
});

const MultiHttpAssertionJsonPathSchema: ZodType<AssertionJsonPath> = z.object({
  expression: AssertionExpressionSchema,
  type: z.literal(MultiHttpAssertionType.JSONPath),
});

const MultiHttpAssertionRegexSchema: ZodType<AssertionRegex> = z.object({
  expression: AssertionExpressionSchema,
  subject: z.nativeEnum(AssertionSubjectVariant),
  type: z.literal(MultiHttpAssertionType.Regex),
});

const MultiHttpAssertionSchema: ZodType<Assertion> = z.union([
  MultiHttpAssertionTextSchema,
  MultiHttpAssertionJsonPathValueSchema,
  MultiHttpAssertionJsonPathSchema,
  MultiHttpAssertionRegexSchema,
]);

const MultiHttpVariablesSchema: ZodType<MultiHttpVariable> = z.object({
  attribute: z.string().optional(),
  expression: z.string().min(1, { message: 'Expression is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
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

export const MultiHttpCheckSchema: ZodType<CheckFormValuesMultiHttp> = BaseCheckSchema.omit({
  frequency: true,
  timeout: true,
}).and(
  z.object({
    checkType: z.literal(CheckType.MULTI_HTTP),
    settings: z.object({
      multihttp: MultiHttpSettingsSchema,
    }),
    frequency: FrequencySchema(MIN_FREQUENCY_MULTI_HTTP),
    timeout: TimeoutSchema(MIN_TIMEOUT_MULTI_HTTP, MAX_TIMEOUT_MULTI_HTTP),
  })
);
