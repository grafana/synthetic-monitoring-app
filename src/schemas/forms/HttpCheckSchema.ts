import { HeadersSchema } from 'schemas/general/Header';
import { HttpTargetSchema } from 'schemas/general/HttpTarget';
import { TLSConfigSchema } from 'schemas/general/TLSConfig';
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

import { BaseCheckSchema } from './BaseCheckSchema';

const HttpRegexBodyValidationSchema: ZodType<HttpRegexBodyValidationFormValue> = z.object({
  matchType: z.literal(HttpRegexValidationType.Body),
  expression: z.string().min(1, 'Expression is required'),
  inverted: z.boolean(),
});

const HttpRegexHeaderValidationSchema: ZodType<HttpRegexHeaderValidationFormValue> = z.object({
  matchType: z.literal(HttpRegexValidationType.Header),
  expression: z.string().min(1, 'Expression is required'),
  inverted: z.boolean(),
  header: z.string().min(1, 'Header is required'),
  allowMissing: z.boolean(),
});

const HttpRegexValidationSchema: ZodType<HttpRegexValidationFormValue> = HttpRegexBodyValidationSchema.or(
  HttpRegexHeaderValidationSchema
);

const HttpSettingsSchema: ZodType<HttpSettingsFormValues> = z.object({
  sslOptions: z.nativeEnum(HttpSslOption),
  headers: HeadersSchema,
  proxyConnectHeaders: HeadersSchema,
  regexValidations: z.array(HttpRegexValidationSchema),
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
  tlsConfig: TLSConfigSchema,
  cacheBustingQueryParamName: z.string().optional(),
});

export const HttpCheckSchema: ZodType<CheckFormValuesHttp> = BaseCheckSchema.and(
  z.object({
    target: HttpTargetSchema,
    checkType: z.literal(CheckType.HTTP),
    settings: z.object({
      http: HttpSettingsSchema,
    }),
  })
);
