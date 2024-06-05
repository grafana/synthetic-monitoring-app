import { z, ZodType } from 'zod';

import { TLSConfig } from 'types';

const PEM_HEADER = '-----BEGIN CERTIFICATE-----';
const PEM_FOOTER = '-----END CERTIFICATE-----';

const CERT_ERROR_MESSAGE = 'Certificate must be in the PEM format.';

export const TLSConfigSchema: ZodType<TLSConfig> = z.object({
  caCert: z.string().refine(validateTLSCACert, {
    message: CERT_ERROR_MESSAGE,
  }),
  clientCert: z.string().refine(validateTLSClientCert, {
    message: CERT_ERROR_MESSAGE,
  }),
  clientKey: z.string().refine(validateTLSClientKey, {
    message: 'Key must be in the PEM format.',
  }),
  insecureSkipVerify: z.boolean(),
  serverName: z.string(),
});

function validateTLSCACert(caCert?: string) {
  if (!caCert) {
    return true;
  }

  if (caCert.indexOf(PEM_HEADER) < 0 || caCert.indexOf(PEM_FOOTER) < 0) {
    return false;
  }

  return true;
}

function validateTLSClientCert(clientCert?: string) {
  if (!clientCert) {
    return true;
  }

  if (clientCert.indexOf(PEM_HEADER) < 0 || clientCert.indexOf(PEM_FOOTER) < 0) {
    return false;
  }

  return true;
}

function validateTLSClientKey(clientKey?: string) {
  if (!clientKey) {
    return true;
  }

  if (clientKey.indexOf('-----BEGIN') < 0 || clientKey.indexOf('-----END') < 0) {
    return false;
  }

  return true;
}
