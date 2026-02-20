import { BROWSER_CHECK_FIELDS } from '../components/form/layouts/BrowserCheckContent';
import { DNS_CHECK_FIELDS } from '../components/form/layouts/DnsCheckContent';
import { GRPC_CHECK_FIELDS } from '../components/form/layouts/GrpcCheckContent';
import { HTTP_CHECK_FIELDS } from '../components/form/layouts/HttpCheckContent';
import { SCRIPTED_CHECK_FIELDS } from '../components/form/layouts/ScriptedCheckContent';
import { TCP_REQUEST_OPTIONS_FIELDS } from '../components/form/layouts/TcpCheckContent';
import { TRACEROUTE_CHECK_FIELDS } from '../components/form/layouts/TracerouteCheckContent';
import { getHasSectionError } from './navigation';

describe('getHasSectionError', () => {
  it('matches when an error path equals or starts with a string field', () => {
    expect(getHasSectionError(['target'], ['target'])).toBe(true);
    expect(getHasSectionError(['settings.http'], ['settings.http.method'])).toBe(true);
    expect(getHasSectionError(['job'], ['target'])).toBe(false);
  });

  it('matches when a RegExp field matches an error path', () => {
    expect(getHasSectionError([/\.entries\.\d+\.request/], ['settings.multihttp.entries.0.request.url'])).toBe(true);
    expect(getHasSectionError([/\.entries\.\d+\.request/], ['target'])).toBe(false);
  });

  describe('check section field arrays match real error paths', () => {
    const fieldArrays = [
      { name: 'HTTP_CHECK_FIELDS', fields: HTTP_CHECK_FIELDS },
      { name: 'GRPC_CHECK_FIELDS', fields: GRPC_CHECK_FIELDS },
      { name: 'DNS_CHECK_FIELDS', fields: DNS_CHECK_FIELDS },
      { name: 'TCP_REQUEST_OPTIONS_FIELDS', fields: TCP_REQUEST_OPTIONS_FIELDS },
      { name: 'TRACEROUTE_CHECK_FIELDS', fields: TRACEROUTE_CHECK_FIELDS },
      { name: 'SCRIPTED_CHECK_FIELDS', fields: SCRIPTED_CHECK_FIELDS },
      { name: 'BROWSER_CHECK_FIELDS', fields: BROWSER_CHECK_FIELDS },
    ];

    it.each(fieldArrays)('$name matches "job" and "target" errors', ({ fields }) => {
      expect(getHasSectionError(fields, ['job'])).toBe(true);
      expect(getHasSectionError(fields, ['target'])).toBe(true);
    });
  });
});
