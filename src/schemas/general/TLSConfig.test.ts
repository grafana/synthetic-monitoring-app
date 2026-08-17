import { tlsConfigSchema } from './TLSConfig';

const VALID_CERT_PEM = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAK. . .example. . .
-----END CERTIFICATE-----`;

const VALID_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIBkTCB+wIJAK. . .example. . .
-----END PRIVATE KEY-----`;

describe('tlsConfigSchema', () => {
  it('accepts a secret reference for the cert and key fields', () => {
    const result = tlsConfigSchema.safeParse({
      caCert: '${secrets.ca}',
      clientCert: '${secrets.client-cert}',
      clientKey: '${secrets.client-key}',
    });

    expect(result.success).toBe(true);
  });

  it('accepts valid PEM certificates and keys', () => {
    const result = tlsConfigSchema.safeParse({
      caCert: VALID_CERT_PEM,
      clientCert: VALID_CERT_PEM,
      clientKey: VALID_KEY_PEM,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a certificate that is neither PEM nor a secret reference', () => {
    const result = tlsConfigSchema.safeParse({ caCert: 'not-a-cert' });

    expect(result.success).toBe(false);
  });

  it('rejects a client key that is neither PEM nor a secret reference', () => {
    const result = tlsConfigSchema.safeParse({ clientKey: 'not-a-key' });

    expect(result.success).toBe(false);
  });
});
