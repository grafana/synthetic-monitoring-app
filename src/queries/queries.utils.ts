// Values are interpolated into PromQL/LogQL selector regexes, which are fully
// anchored. Each character needs up to two escaping layers, applied in a
// single pass so nothing is ever re-escaped: RE2 metacharacters so values
// match literally, then string-literal escaping (backslashes doubled, quotes
// escaped) because double-quoted PromQL/LogQL strings reject unknown escape
// sequences like `\.`.
function escapeRe2(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|"]/g, (char) => {
    if (char === '"') {
      return '\\"';
    }
    if (char === '\\') {
      // regex layer: \\ — string layer doubles each backslash
      return '\\\\\\\\';
    }
    // regex layer: \<char> — string layer doubles the backslash
    return `\\\\${char}`;
  });
}

/**
 * Join values into a `=~` selector regex alternation, each value escaped so
 * it matches literally. Deduplicates to keep the expression as short as
 * possible.
 */
export function joinRegexValues(values: string[]): string {
  return [...new Set(values)].map(escapeRe2).join('|');
}
