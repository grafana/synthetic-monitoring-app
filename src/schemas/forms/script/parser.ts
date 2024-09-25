import { Node, ObjectExpression, parse, Property } from 'acorn';
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

function getPropertyValueByPath(obj: ObjectExpression, path: string[]): any {
  let current: any = obj;
  for (const key of path) {
    if (current.type !== 'ObjectExpression') {
      return undefined;
    }

    const property = current.properties.find(
      (prop: Property) => prop.key.type === 'Identifier' && prop.key.name === key
    );
    if (property?.value.type === 'ObjectExpression') {
      current = property.value;
    } else if (property?.value.type === 'Literal') {
      current = property.value.value;
    } else {
      return undefined;
    }
  }
  return current;
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

export function checkForChromium(objectExpression: ObjectExpression): boolean {
  const scenarios = getPropertyValueByPath(objectExpression, ['scenarios']);
  if (!scenarios || scenarios.type !== 'ObjectExpression') {
    return false;
  }

  for (const scenario of scenarios.properties) {
    if (scenario.key.type === 'Identifier') {
      const type = getPropertyValueByPath(scenario.value, ['options', 'browser', 'type']);
      if (type === 'chromium') {
        return true;
      }
    }
  }

  return false;
}

export function hasInvalidProperties(objectExpression: ObjectExpression): boolean {
  const scenarios = getPropertyValueByPath(objectExpression, ['scenarios']);
  if (!scenarios || scenarios.type !== 'ObjectExpression') {
    return false;
  }

  const invalidProps = ['duration', 'vus', 'iterations'];

  for (const scenario of scenarios.properties) {
    if (scenario.key.type === 'Identifier') {
      const uiValue = scenario.value;
      for (const prop of invalidProps) {
        const propValue = getPropertyValueByPath(uiValue, [prop]);
        if (propValue !== undefined) {
          return true;
        }
      }
    }
  }

  return false;
}

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
