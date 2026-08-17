import { HTTPCheck } from 'types';
import { toBase64 } from 'utils';
import { FALLBACK_CHECK_HTTP } from 'components/constants';

import { getHTTPCheckFormValues } from './toFormValues.http';

function httpCheckWith(http: Partial<HTTPCheck['settings']['http']>): HTTPCheck {
  return {
    ...FALLBACK_CHECK_HTTP,
    settings: { http: { ...FALLBACK_CHECK_HTTP.settings.http, ...http } },
  };
}

describe('getHTTPCheckFormValues — secret references', () => {
  it('keeps a bearer-token secret reference verbatim in form values', () => {
    const fv = getHTTPCheckFormValues(httpCheckWith({ bearerToken: '${secrets.tok}', secretManagerEnabled: true }));
    expect(fv.settings.http.bearerToken).toBe('${secrets.tok}');
  });

  it('decodes a base64-wrapped TLS cert secret reference back to the literal', () => {
    const fv = getHTTPCheckFormValues(
      httpCheckWith({ tlsConfig: { caCert: toBase64('${secrets.ca}') }, secretManagerEnabled: true })
    );
    expect(fv.settings.http.tlsConfig?.caCert).toBe('${secrets.ca}');
  });

  it('never leaks secretManagerEnabled into form values', () => {
    const fv = getHTTPCheckFormValues(httpCheckWith({ bearerToken: '${secrets.tok}', secretManagerEnabled: true }));
    expect('secretManagerEnabled' in fv.settings.http).toBe(false);
  });
});
