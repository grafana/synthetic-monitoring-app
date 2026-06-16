import { faro } from '@grafana/faro-web-sdk';

import { FaroEvent, reportError } from 'faro';

const mockPushError = jest.fn();

beforeEach(() => {
  // faro is a getter-backed singleton that lazily initialises api after initializeFaro().
  // In tests we haven't called initializeFaro(), so api is undefined.
  // @ts-expect-error — partial mock: only pushError is needed for reportError tests
  faro.api = { pushError: mockPushError };
});

describe(`reportError`, () => {
  it(`should pass an Error instance through to pushError unchanged`, () => {
    const err = new Error('something broke');
    reportError(err, FaroEvent.Init);

    expect(mockPushError).toHaveBeenCalledWith(err, { type: FaroEvent.Init });
  });

  it(`should wrap a string message in an Error before sending`, () => {
    reportError('bad request', FaroEvent.CreateCheck);

    const [sentError, meta] = mockPushError.mock.calls[0];
    expect(sentError).toBeInstanceOf(Error);
    expect(sentError.message).toBe('bad request');
    expect(meta).toEqual({ type: FaroEvent.CreateCheck });
  });

  it(`should not serialize arbitrary objects into the error message`, () => {
    const payload = { data: { msg: 'ok' }, secret: 'should-not-appear' };
    // @ts-expect-error — verifying runtime safety for callers that bypass type checks
    reportError(payload, FaroEvent.Init);

    const [sentError] = mockPushError.mock.calls[0];
    expect(sentError).toBeInstanceOf(Error);
    expect(sentError.message).not.toContain('should-not-appear');
    expect(sentError.message).not.toContain('"data"');
  });

  it(`should accept a call without a FaroEvent type`, () => {
    reportError('no type');

    const [sentError, meta] = mockPushError.mock.calls[0];
    expect(sentError.message).toBe('no type');
    expect(meta).toEqual({ type: undefined });
  });

  it(`should swallow exceptions from pushError`, () => {
    mockPushError.mockImplementationOnce(() => {
      throw new Error('faro is down');
    });

    expect(() => reportError('test')).not.toThrow();
  });
});
