import fs from 'fs';
import path from 'path';
import { faro } from '@grafana/faro-web-sdk';

import { FaroEvent, FaroUserAction, reportError } from 'faro';

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

function collectAppSource(dir: string): string {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'node_modules') {
          return [];
        }

        return collectAppSource(fullPath);
      }

      if (entry.name === 'faro.ts' || /\.test\.(ts|tsx)$/.test(entry.name) || !/\.(ts|tsx)$/.test(entry.name)) {
        return [];
      }

      return [fs.readFileSync(fullPath, 'utf8')];
    })
    .join('\n');
}

function unusedMembers(enumName: string, members: string[], source: string) {
  return members.filter((member) => !source.includes(`${enumName}.${member}`));
}

describe(`Faro enums are referenced in the app`, () => {
  const source = collectAppSource(path.join(__dirname));

  it(`uses every FaroEvent at least once`, () => {
    expect(unusedMembers('FaroEvent', Object.keys(FaroEvent), source)).toEqual([]);
  });

  it(`uses every FaroUserAction at least once`, () => {
    expect(unusedMembers('FaroUserAction', Object.keys(FaroUserAction), source)).toEqual([]);
  });
});
