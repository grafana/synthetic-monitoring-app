import { joinRegexValues } from './queries.utils';

describe(`joinRegexValues`, () => {
  it(`joins values with alternation and deduplicates`, () => {
    expect(joinRegexValues(['api', 'web', 'api'])).toBe('api|web');
  });

  it(`escapes regex metacharacters through both the regex and string layers`, () => {
    // In the final query string, `.` must arrive at the regex engine as `\.`,
    // which needs `\\.` in the double-quoted PromQL/LogQL string literal.
    expect(joinRegexValues(['example.com'])).toBe('example\\\\.com');
    expect(joinRegexValues(['a+b(c)'])).toBe('a\\\\+b\\\\(c\\\\)');
  });

  it(`escapes quotes and backslashes so the string literal stays valid`, () => {
    expect(joinRegexValues(['say "hi"'])).toBe('say \\"hi\\"');
    expect(joinRegexValues(['back\\slash'])).toBe('back\\\\\\\\slash');
  });
});
