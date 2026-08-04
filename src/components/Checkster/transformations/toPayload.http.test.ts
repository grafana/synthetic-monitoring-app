import { FALLBACK_CHECK_HTTP } from 'components/constants';

import { getHTTPCheckFormValues } from './toFormValues.http';
import { getHTTPPayload } from './toPayload.http';

// A valid HTTP form-values object derived from the fallback check; individual
// credential fields are overridden per test.
function baseFormValues() {
  return getHTTPCheckFormValues(FALLBACK_CHECK_HTTP);
}

describe('getHTTPPayload — secretManagerEnabled inference', () => {
  it('is omitted when no credential field references a secret', () => {
    const payload = getHTTPPayload(baseFormValues());
    expect(payload.settings.http.secretManagerEnabled).toBeUndefined();
  });

  it('is true when the bearer token references a secret', () => {
    const fv = baseFormValues();
    fv.settings.http.bearerToken = '${secrets.my-token}';
    expect(getHTTPPayload(fv).settings.http.secretManagerEnabled).toBe(true);
  });

  it('is true when the basic-auth password references a secret', () => {
    const fv = baseFormValues();
    fv.settings.http.basicAuth = { username: 'admin', password: '${secrets.pw}' };
    expect(getHTTPPayload(fv).settings.http.secretManagerEnabled).toBe(true);
  });

  it('is not set when only the username looks like a secret reference', () => {
    const fv = baseFormValues();
    fv.settings.http.basicAuth = { username: '${secrets.user}', password: 'plaintext' };
    expect(getHTTPPayload(fv).settings.http.secretManagerEnabled).toBeUndefined();
  });

  it.each(['caCert', 'clientCert', 'clientKey'] as const)('is true when TLS %s references a secret', (key) => {
    const fv = baseFormValues();
    fv.settings.http.tlsConfig = { [key]: '${secrets.cert}' };
    expect(getHTTPPayload(fv).settings.http.secretManagerEnabled).toBe(true);
  });
});
