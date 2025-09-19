// Shared script validation rules for both Zod validation and Monaco markers

export const K6_PRAGMA_MESSAGE =
  'Version directives cannot be used within scripts. Please remove any "use k6" statements.';

export const K6_EXTENSION_MESSAGE =
  'Script imports k6 extensions which are not allowed. Please remove imports from k6/x/ paths.';

const VALIDATION_RULES = {
  pragma: {
    // Match patterns like: "use k6 >= v1.0.0", "use k6 > 0.52", `use k6 >= v1.0.0`, etc.
    pattern: /["'`]use\s+k6\s*[><=!]+\s*v?\d+(?:\.\d*)*(?:[-+][\w.]+)*["'`]/i,
    message: K6_PRAGMA_MESSAGE,
  },
  extension: {
    // Match import statements that include k6/x/ paths
    pattern: /import\s+.*from\s*[\'"`][^'"`]*k6\/x\/[^'"`]*[\'"`]/i,
    message: K6_EXTENSION_MESSAGE,
  },
} as const;

export function hasK6Pragma(script: string): boolean {
  return VALIDATION_RULES.pragma.pattern.test(script);
}

export function hasK6ExtensionImports(script: string): boolean {
  return VALIDATION_RULES.extension.pattern.test(script);
}

export type ScriptRuleMatch = {
  startIndex: number;
  endIndex: number;
  message: string;
};

/**
 * Finds all matches for a specific pattern in the script
 */
const findPatternMatches = (script: string, pattern: RegExp, message: string): ScriptRuleMatch[] => {
  const matches: ScriptRuleMatch[] = [];
  // Create a new global regex from the pattern to avoid global state issues
  const globalPattern = new RegExp(pattern.source, pattern.flags + 'g');
  
  let match: RegExpExecArray | null;
  while ((match = globalPattern.exec(script))) {
    matches.push({ 
      startIndex: match.index, 
      endIndex: match.index + match[0].length, 
      message 
    });
    
    // Prevent infinite loops on zero-length matches
    if (globalPattern.lastIndex === match.index) {
      globalPattern.lastIndex++;
    }
  }
  
  return matches;
};

/**
 * Finds all script validation rule violations
 */
export function findRuleViolations(script: string): ScriptRuleMatch[] {
  return Object.values(VALIDATION_RULES).flatMap(rule =>
    findPatternMatches(script, rule.pattern, rule.message)
  );
}
