import { Node, ObjectExpression, parse, Property, SpreadElement } from 'acorn';
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

export type ObjectDeclarations = Map<string, ObjectExpression>;

// a spread is resolvable when it references an object literal declared in the same script
function resolveSpreadTarget(spread: SpreadElement, declarations: ObjectDeclarations): ObjectExpression | undefined {
  return spread.argument.type === 'Identifier' ? declarations.get(spread.argument.name) : undefined;
}

// resolves the effective list of properties of an object expression, expanding spreads
// of locally declared objects (e.g. `{ ...defaultOptions }`) so their properties are visible.
// `expanding` guards against circular references, e.g. `const a = { ...a }`
function expandProperties(
  obj: ObjectExpression,
  declarations: ObjectDeclarations,
  expanding: Set<ObjectExpression> = new Set()
): Property[] {
  if (expanding.has(obj)) {
    return [];
  }
  expanding.add(obj);

  const properties = obj.properties.flatMap((prop): Property[] => {
    if (prop.type === 'Property') {
      return [prop];
    }

    const resolved = resolveSpreadTarget(prop, declarations);
    return resolved ? expandProperties(resolved, declarations, expanding) : [];
  });

  expanding.delete(obj);

  return dedupeProperties(properties);
}

// when the same key appears multiple times (e.g. provided by a spread and overridden
// explicitly) only the last occurrence applies, matching JavaScript spread semantics
function dedupeProperties(properties: Property[]): Property[] {
  const lastByName = new Map<string, Property>();

  for (const prop of properties) {
    if (prop.key.type === 'Identifier') {
      lastByName.set(prop.key.name, prop);
    }
  }

  return properties.filter((prop) => prop.key.type !== 'Identifier' || lastByName.get(prop.key.name) === prop);
}

function getPropertyValueByPath(obj: ObjectExpression, path: string[], declarations: ObjectDeclarations): any {
  let current: any = obj;
  for (const key of path) {
    if (current?.type !== 'ObjectExpression') {
      return undefined;
    }

    const properties = expandProperties(current, declarations);
    const property = properties.find((prop: Property) => prop.key.type === 'Identifier' && prop.key.name === key);
    if (property?.value.type === 'ObjectExpression') {
      current = property.value;
    } else if (property?.value.type === 'Literal') {
      current = property.value.value;
    } else {
      return property?.value;
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

export function getProperty(objectExpression: ObjectExpression, propPath: string[], declarations: ObjectDeclarations) {
  const scenarios = getPropertyValueByPath(objectExpression, ['scenarios'], declarations);
  if (!scenarios || scenarios.type !== 'ObjectExpression') {
    return undefined;
  }

  for (const scenario of expandProperties(scenarios, declarations)) {
    if (scenario.key.type === 'Identifier' && scenario.value.type === 'ObjectExpression') {
      const propValue = getPropertyValueByPath(scenario.value, propPath, declarations);
      return propValue;
    }
  }
}

// true when the object (or any nested object, following resolvable spreads) contains a spread
// we can't statically resolve, e.g. `...importedOptions` or `...buildOptions()`
export function containsUnresolvableSpread(
  objectExpression: ObjectExpression,
  declarations: ObjectDeclarations,
  seen: Set<ObjectExpression> = new Set()
): boolean {
  if (seen.has(objectExpression)) {
    return false;
  }
  seen.add(objectExpression);

  return objectExpression.properties.some((prop) => {
    if (prop.type === 'SpreadElement') {
      const resolved = resolveSpreadTarget(prop, declarations);
      return resolved ? containsUnresolvableSpread(resolved, declarations, seen) : true;
    }

    if (prop.value.type === 'ObjectExpression') {
      return containsUnresolvableSpread(prop.value, declarations, seen);
    }

    return false;
  });
}

const objectDeclarationMatcher: SimpleVisitors<ObjectDeclarations> = {
  VariableDeclaration(node, state) {
    for (const declaration of node.declarations) {
      if (declaration.id.type === 'Identifier' && declaration.init?.type === 'ObjectExpression') {
        state.set(declaration.id.name, declaration.init);
      }
    }
  },
};

export function collectObjectDeclarations(program: Node): ObjectDeclarations {
  const declarations: ObjectDeclarations = new Map();

  walk(program, objectDeclarationMatcher, undefined, declarations);

  return declarations;
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
