import { BASIC_HTTP_CHECK, FULL_HTTP_CHECK } from 'test/fixtures/checks';

import { HTTPCheck, HttpVersion } from 'types';

import { formatHttpCheckDefinition } from './httpCheckDefinition';

describe('formatHttpCheckDefinition', () => {
  it('separates common definition facts from HTTP-specific uptime rules', () => {
    const check: HTTPCheck = { ...FULL_HTTP_CHECK, frequency: 60_000, timeout: 10_000 };
    const model = formatHttpCheckDefinition(check);

    expect(model.title).toBe(FULL_HTTP_CHECK.job);
    expect(model.typeLabel).toBe('HTTP');
    expect(model.qualifier?.text).toBe('GET');
    expect(model.target?.value).toBe(FULL_HTTP_CHECK.target);
    expect(model.facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'schedule', label: 'Runs', value: 'Every 1m from 2 probes' }),
        expect.objectContaining({ id: 'timeout', label: 'Timeout', value: '10s' }),
        expect.objectContaining({ id: 'uptime-rules', label: 'Uptime rules' }),
      ])
    );
    expect(model.facts.find((fact) => fact.id === 'uptime-rules')?.value).toContain('SSL required');
    expect(model.details?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'request-headers', value: '1 configured' }),
        expect.objectContaining({ id: 'body', value: 'Configured' }),
      ])
    );
  });

  it('uses concise defaults and clean separators for a basic HTTP check', () => {
    const basicCheck: HTTPCheck = {
      ...BASIC_HTTP_CHECK,
      settings: {
        http: {
          ...BASIC_HTTP_CHECK.settings.http,
          validStatusCodes: [],
          validHTTPVersions: [HttpVersion.Http1_1, HttpVersion.Http2_0],
          failIfNotSSL: false,
          failIfSSL: false,
          failIfBodyMatchesRegexp: [],
          failIfBodyNotMatchesRegexp: [],
          failIfHeaderMatchesRegexp: [],
          failIfHeaderNotMatchesRegexp: [],
        },
      },
    };
    const model = formatHttpCheckDefinition(basicCheck);
    const uptimeRules = model.facts.find((fact) => fact.id === 'uptime-rules')?.value;

    expect(uptimeRules).toBe('2xx');
    expect(uptimeRules).not.toContain('undefined');
    expect(uptimeRules).not.toMatch(/^·|·$/);
  });

  it('never serializes sensitive request configuration', () => {
    const sensitiveCheck: HTTPCheck = {
      ...FULL_HTTP_CHECK,
      settings: {
        http: {
          ...FULL_HTTP_CHECK.settings.http,
          body: 'sensitive-body',
          headers: ['Authorization:sensitive-header-value'],
          bearerToken: 'sensitive-bearer-token',
          basicAuth: { username: 'sensitive-user', password: 'sensitive-password' },
          proxyURL: 'https://sensitive-proxy.example',
          tlsConfig: {
            ...FULL_HTTP_CHECK.settings.http.tlsConfig,
            clientKey: 'sensitive-client-key',
          },
        },
      },
    };
    const serialized = JSON.stringify(formatHttpCheckDefinition(sensitiveCheck));

    expect(serialized).not.toContain('sensitive-body');
    expect(serialized).not.toContain('sensitive-header-value');
    expect(serialized).not.toContain('sensitive-bearer-token');
    expect(serialized).not.toContain('sensitive-user');
    expect(serialized).not.toContain('sensitive-password');
    expect(serialized).not.toContain('sensitive-proxy.example');
    expect(serialized).not.toContain('sensitive-client-key');
  });
});
