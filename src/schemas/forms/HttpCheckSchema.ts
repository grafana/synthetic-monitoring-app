import { HttpTargetSchema } from 'schemas/general/HttpTarget';
import { LabelsSchema } from 'schemas/general/Label';
import { TLSConfigSchema } from 'schemas/general/TLSConfig';
import { z, ZodType } from 'zod';

import {
  CheckFormValuesHttp,
  CheckType,
  HTTPCompressionAlgo,
  HttpMethod,
  HttpRegexValidationFormValue,
  HttpRegexValidationType,
  HttpSettingsFormValues,
  HttpSslOption,
  HttpVersion,
  IpVersion,
} from 'types';

import { BaseCheckSchema } from './BaseCheckSchema';

const HttpRegexValidationSchema: ZodType<HttpRegexValidationFormValue> = z.object({
  matchType: z.nativeEnum(HttpRegexValidationType),
  expression: z.string(),
  inverted: z.boolean(),
  header: z.string(),
  allowMissing: z.boolean(),
});

const HttpSettingsSchema: ZodType<HttpSettingsFormValues> = z.object({
  sslOptions: z.nativeEnum(HttpSslOption),
  headers: LabelsSchema,
  proxyConnectHeaders: LabelsSchema,
  regexValidations: z.array(HttpRegexValidationSchema),
  followRedirects: z.boolean(),
  compression: z.nativeEnum(HTTPCompressionAlgo),
  proxyURL: z.string(),
  ipVersion: z.nativeEnum(IpVersion),
  method: z.nativeEnum(HttpMethod),

  body: z.string(),
  validHTTPVersions: z.array(z.nativeEnum(HttpVersion)),
  validStatusCodes: z.array(z.number()),
  bearerToken: z.string().optional(),
  basicAuth: z.object({
    username: z.string(),
    password: z.string(),
  }),
  tlsConfig: TLSConfigSchema,
});

const HttpSchemaValues = z.object({
  target: HttpTargetSchema,
  checkType: z.literal(CheckType.HTTP),
  settings: z.object({
    http: HttpSettingsSchema,
  }),
});

export const HttpCheckSchema: ZodType<CheckFormValuesHttp> = BaseCheckSchema.and(HttpSchemaValues);
