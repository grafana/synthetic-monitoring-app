import { parseExpectLogLine } from './utils';

describe('utils', () => {
  describe('parseExpectLogLine', () => {
    it('should parse the `msg` created by using `expect` in scripted checks', () => {
      const subject = `test aborted: error=expect(received).toBe(expected) at=/script.k6:26:65 expected="hello, world!" received=200 filename=script.k6 line=26 at O (https://jslib.k6.io/k6-testing/assert.ts:54:20(32))`;
      const expected = {
        error: 'expect(received).toBe(expected)',
        at: '/script.k6:26:65',
        expected: 'hello, world!',
        received: 200,
        filename: 'script.k6',
        line: '26 at O (https://jslib.k6.io/k6-testing/assert.ts:54:20(32))',
      };

      const result = parseExpectLogLine(subject);
      expect(result).toEqual(expected);
    });
  });
});
