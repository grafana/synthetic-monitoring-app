import { Address6 } from 'ip-address';
import validUrl from 'valid-url';
import { z } from 'zod';

import { validateHostname } from 'validation';

import { TargetSchema } from './Target';

export const HttpTargetSchema = TargetSchema.and(z.string().superRefine(validateHttpTarget));

function validateHttpTarget(target: string, ctx: z.RefinementCtx) {
  let message = 'Target must be a valid web URL';

  try {
    const httpEncoded = encodeURI(target);
    const isValidUrl = Boolean(validUrl.isWebUri(httpEncoded));

    if (!isValidUrl) {
      throw new Error(message);
    }
  } catch {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
    });
  }

  try {
    const parsedUrl = new URL(target);

    if (!parsedUrl.protocol) {
      message = 'Target must have a valid protocol';
      throw new Error(message);
    }

    // isWebUri will allow some invalid hostnames, so we need addional validation
    const ipv6 = isIpV6FromUrl(target);
    if (ipv6) {
      return undefined;
    }

    const hostname = parsedUrl.hostname;
    if (validateHostname(hostname)) {
      return 'Target must have a valid hostname';
    }
  } catch {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
    });
  }
}

const isIpV6FromUrl = (target: string): boolean => {
  let isIpV6 = true;
  try {
    const address = Address6.fromURL(target);
    isIpV6 = Boolean(address.address);
  } catch (e) {
    isIpV6 = false;
  }
  return isIpV6;
};
