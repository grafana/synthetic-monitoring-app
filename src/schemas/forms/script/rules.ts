// Shared script validation rules for both Zod validation and Monaco markers

export const K6_PRAGMA_MESSAGE =
  'Script contains a k6 version pragma which is not allowed. Please remove the "use k6" directive.';

export const K6_EXTENSION_MESSAGE =
  'Script imports k6 extensions which are not allowed. Please remove imports from k6/x/ paths.';

// Match patterns like: "use k6 >= v1.0.0", "use k6 > 0.52", etc.
export const K6_PRAGMA_REGEX = /["']use\s+k6\s*[><=!]+\s*v?\d+/gi;

// Match import statements that include k6/x/ paths
export const K6_EXTENSION_IMPORT_REGEX = /import\s+.*from\s*[\'"`][^'"`]*k6\/x\/[^'"`]*[\'"`]/gi;

export function hasK6Pragma(script: string): boolean {
  K6_PRAGMA_REGEX.lastIndex = 0;
  return K6_PRAGMA_REGEX.test(script);
}

export function hasK6ExtensionImports(script: string): boolean {
  K6_EXTENSION_IMPORT_REGEX.lastIndex = 0;
  return K6_EXTENSION_IMPORT_REGEX.test(script);
}

export type ScriptRuleMatch = {
  startIndex: number;
  endIndex: number;
  message: string;
};

export function findRuleViolations(script: string): ScriptRuleMatch[] {
  const matches: ScriptRuleMatch[] = [];

  const checkRegex = (pattern: RegExp, message: string) => {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(script))) {
      matches.push({ startIndex: m.index, endIndex: m.index + m[0].length, message });
      // Prevent infinite loops on zero-length matches
      if (pattern.lastIndex === m.index) {
        pattern.lastIndex++;
      }
    }
  };

  checkRegex(K6_PRAGMA_REGEX, K6_PRAGMA_MESSAGE);
  checkRegex(K6_EXTENSION_IMPORT_REGEX, K6_EXTENSION_MESSAGE);

  return matches;
}
