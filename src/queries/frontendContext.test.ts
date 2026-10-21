import {
  buildBuildActivityLogQL,
  buildFailureStream,
  buildJourneyErrorSessionsLogQL,
  buildJourneySessionsLogQL,
  buildRealUserBuildLoadsLogQL,
  escapeLogQLString,
} from 'queries/frontendContext';

const PRODUCTS_500 = "Response not ok. Status code: 500. Message: 'Failed to load products'. Url: <URL>";

describe('buildFailureStream', () => {
  it('matches exceptions on the template and leaves k6 sessions out', () => {
    const stream = buildFailureStream('5385', { kind: 'exception', template: PRODUCTS_500, message: 'raw' });

    expect(stream).toContain(
      `value_template="Response not ok. Status code: 500. Message: 'Failed to load products'. Url: <URL>"`
    );
    expect(stream).toContain('k6_isK6Browser=~""');
  });

  it('matches failed requests on endpoint, method and status under either SDK naming', () => {
    const stream = buildFailureStream('5385', {
      kind: 'request',
      method: 'GET',
      url: 'https://shop.example/api/products?x=1',
      urlTemplate: 'https://shop.example/api/products',
      statusCode: 500,
    });

    expect(stream).toContain('event_data_url_template="https://shop.example/api/products"');
    expect(stream).toContain('(event_data_http_response_status_code="500" or event_data_http_status_code="500")');
    expect(stream).toContain('(event_data_http_request_method="GET" or event_data_http_method="GET")');
  });
});

describe('Faro comparison scope', () => {
  it('scopes every comparison to the reported environment, escaping its value', () => {
    const scope = { appId: '5385', appEnvironment: 'prod"blue' };
    const queries = [
      buildBuildActivityLogQL({ ...scope, step: '15m' }),
      buildRealUserBuildLoadsLogQL({ ...scope, range: '1h' }),
      buildFailureStream(scope.appId, { kind: 'exception', message: 'Oops' }, scope.appEnvironment),
      buildJourneySessionsLogQL({ ...scope, pageIds: ['/cart'], range: '1h' }),
      buildJourneyErrorSessionsLogQL({ ...scope, pageIds: ['/cart'], range: '1h' }),
    ];
    for (const query of queries) {
      expect(query).toContain('| app_environment="prod\\"blue"');
    }
    expect(buildBuildActivityLogQL({ appId: '5385', step: '15m' })).not.toContain('app_environment');
  });

  it('includes exception-only sessions in the journey visitor population', () => {
    expect(buildJourneySessionsLogQL({ appId: '5385', pageIds: ['/cart'], range: '1h' })).toContain(
      'kind=~"event|measurement|exception"'
    );
  });

  it('escapes control characters in multiline error messages and templates', () => {
    const message = 'Failed "request"\nreason:\tserver\r\npath: C:\\app\u0000';
    expect(escapeLogQLString(message)).not.toMatch(/[\n\r\t\u0000]/);
    expect(JSON.parse(`"${escapeLogQLString(message)}"`)).toBe(message);
    expect(buildFailureStream('5385', { kind: 'exception', message })).toContain(
      `value="${escapeLogQLString(message)}"`
    );
  });
});
