import { headersSchema } from 'schemas/general/Header';
import { httpTargetSchema } from 'schemas/general/HttpTarget';
import { tlsConfigSchema } from 'schemas/general/TLSConfig';
import { z, ZodType } from 'zod';

import {
  CheckFormValuesHttp,
  CheckType,
  HTTPCompressionAlgo,
  HttpMethod,
  HttpRegexBodyValidationFormValue,
  HttpRegexHeaderValidationFormValue,
  HttpRegexValidationFormValue,
  HttpRegexValidationType,
  HttpSettingsFormValues,
  HttpSslOption,
  HttpVersion,
  IpVersion,
} from 'types';

import { baseCheckSchema } from './BaseCheckSchema';

const httpRegexBodyValidationSchema: ZodType<HttpRegexBodyValidationFormValue> = z.object({
  matchType: z.literal(HttpRegexValidationType.Body),
  expression: z.string().min(1, 'Expression is required'),
  inverted: z.boolean(),
});

const httpRegexHeaderValidationSchema: ZodType<HttpRegexHeaderValidationFormValue> = z.object({
  matchType: z.literal(HttpRegexValidationType.Header),
  expression: z.string().min(1, 'Expression is required'),
  inverted: z.boolean(),
  header: z.string().min(1, 'Header is required'),
  allowMissing: z.boolean(),
});

const httpRegexValidationSchema: ZodType<HttpRegexValidationFormValue> = httpRegexBodyValidationSchema.or(
  httpRegexHeaderValidationSchema
);

const httpSettingsSchema: ZodType<HttpSettingsFormValues> = z.object({
  sslOptions: z.nativeEnum(HttpSslOption),
  headers: headersSchema,
  proxyConnectHeaders: headersSchema,
  regexValidations: z.array(httpRegexValidationSchema),
  followRedirects: z.boolean(),
  compression: z.nativeEnum(HTTPCompressionAlgo),
  proxyURL: z.string().optional(),
  ipVersion: z.nativeEnum(IpVersion),
  method: z.nativeEnum(HttpMethod),
  body: z.string().optional(),
  validHTTPVersions: z.array(z.nativeEnum(HttpVersion)),
  validStatusCodes: z.array(z.number()),
  bearerToken: z.string().optional(),
  basicAuth: z
    .object({
      username: z.string(),
      password: z.string(),
    })
    .optional()
    .superRefine((data, ctx) => {
      if (!data) {
        return;
      }
      if (!data.username && data.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Username is required',
          path: ['username'],
        });
      }
      if (data.username && !data.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password is required',
          path: ['password'],
        });
      }
    }),
  tlsConfig: tlsConfigSchema,
  cacheBustingQueryParamName: z.string().optional(),
});

export const httpCheckSchema: ZodType<CheckFormValuesHttp> = baseCheckSchema.and(
  z.object({
    target: httpTargetSchema,
    checkType: z.literal(CheckType.HTTP),
    settings: z.object({
      http: httpSettingsSchema,
    }),
  })
);
