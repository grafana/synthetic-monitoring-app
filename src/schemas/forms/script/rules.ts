import type { Node } from 'acorn';
import { simple as walk, SimpleVisitors } from 'acorn-walk';

export const K6_PRAGMA_MESSAGE =
  'Version directives cannot be used within scripts. Please remove any "use k6" statements.';

export const K6_EXTENSION_MESSAGE =
  'Script imports k6 extensions which are not allowed. Please remove imports from k6/x/ paths.';

const K6_VERSION_DIRECTIVE_PATTERN = /^use\s+k6(\s+with\s+k6\/x\/[\w/-]+)?\s*[><=!]+\s*v?\d+(?:\.\d*)*(?:[-+][\w.]*)*$/i;

export function isK6VersionDirective(value: string): boolean {
  return K6_VERSION_DIRECTIVE_PATTERN.test(value.trim());
}
export interface K6ValidationIssue {
  type: 'pragma' | 'extension';
  node: Node;
  message: string;
  code: string;
}

export interface K6ValidationResult {
  hasPragmas: boolean;
  hasExtensions: boolean;
  issues: K6ValidationIssue[];
}

// Single AST walk that serves both Monaco (needs locations) and Zod (needs booleans)
export function validateK6Restrictions(script: string, parseScript: (script: string) => Node | null): K6ValidationResult {
  const ast = parseScript(script);
  if (!ast) {
    return { hasPragmas: false, hasExtensions: false, issues: [] };
  }

  const issues: K6ValidationIssue[] = [];

  const visitors: SimpleVisitors<{}> = {
    ExpressionStatement(node) {
      if (node.expression.type === 'Literal' && typeof node.expression.value === 'string') {
        if (isK6VersionDirective(node.expression.value)) {
          issues.push({
            type: 'pragma',
            node: node.expression,
            message: K6_PRAGMA_MESSAGE,
            code: 'k6-pragma-forbidden',
          });
        }
      }

      if (node.expression.type === 'TemplateLiteral' && node.expression.quasis) {
        node.expression.quasis.forEach((quasi) => {
          if (quasi.value?.raw && isK6VersionDirective(quasi.value.raw)) {
            issues.push({
              type: 'pragma',
              node: quasi,
              message: K6_PRAGMA_MESSAGE,
              code: 'k6-pragma-forbidden',
            });
          }
        });
      }
    },

    ImportDeclaration(node) {
      if (node.source?.type === 'Literal' && typeof node.source.value === 'string') {
        const importPath = node.source.value;
        if (importPath.startsWith('k6/x/')) {
          issues.push({
            type: 'extension',
            node: node,
            message: K6_EXTENSION_MESSAGE,
            code: 'k6-extension-forbidden',
          });
        }
      }
    },
  };

  walk(ast, visitors, undefined, {});
  
  return {
    hasPragmas: issues.some(issue => issue.type === 'pragma'),
    hasExtensions: issues.some(issue => issue.type === 'extension'),
    issues,
  };
}
