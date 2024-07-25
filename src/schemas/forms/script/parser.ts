import { Node, ObjectExpression, parse } from 'acorn';
import { simple as walk, SimpleVisitors } from 'acorn-walk';

export function parseScript(script: string) {
  try {
    return parse(script, {
      ecmaVersion: 2023,
      sourceType: 'module',
      locations: true,
    });
  } catch (e) {
    return null;
  }
}

interface ExtractOptionsState {
  options: ObjectExpression | null;
}

const optionExportMatcher: SimpleVisitors<{ options: ObjectExpression | null }> = {
  ExportNamedDeclaration(node, state) {
    if (node.declaration?.type !== 'VariableDeclaration') {
      return;
    }

    const options = node.declaration.declarations.find(
      (declaration) => declaration.id.type === 'Identifier' && declaration.id.name === 'options'
    );

    if (!options) {
      return;
    }

    if (options.init?.type !== 'ObjectExpression') {
      return;
    }

    state.options = options.init;
  },
};

interface ImportBrowserState {
  importStatement: Node | null;
}

const importMatcher: SimpleVisitors<ImportBrowserState> = {
  ImportDeclaration(node, state) {
    if (node.source.value === 'k6/browser') {
      // Check if it imports { browser }
      const hasBrowserImport = node.specifiers.some((specifier) => {
        if (specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier') {
          return specifier.imported.name === 'browser';
        }
        return false;
      });
      if (hasBrowserImport) {
        state.importStatement = node;
      }
    }
  },
};

export function extractOptionsExport(program: Node) {
  const state: ExtractOptionsState = {
    options: null,
  };

  walk(program, optionExportMatcher, undefined, state);

  return state.options;
}

export function extractImportStatement(program: Node) {
  const state: ImportBrowserState = {
    importStatement: null,
  };

  walk(program, importMatcher, undefined, state);

  return state.importStatement;
}
