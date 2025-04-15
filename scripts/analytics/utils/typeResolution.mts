import type { JSDoc, Type } from 'ts-morph';

/**
 * Resolves a TypeScript type to a string representation. For example for:
 *   type Action = "click" | "hover"
 * `Action` resolves to `"click" | "hover"`
 *
 * @param type  Type to resolve
 * @param visitedTypes  Set of already visited types to prevent infinite recursion
 * @returns String representation of the type
 */
export function resolveType(type: Type, visitedTypes = new Set<string>()): string {
  const typeId = type.getSymbol()?.getName() || type.getText();
  if (visitedTypes.has(typeId)) {
    return typeId; // Return the type name if we've seen it before
  }
  visitedTypes.add(typeId);

  // If the type is an enum, resolve it to a union of its values
  if (type.isEnum()) {
    const enumMembers = type.getSymbol()?.getDeclarations()?.[0]?.getChildren() || [];

    const values = enumMembers
      .filter((member) => member.getKindName() === 'SyntaxList' && member.getText() !== `export`)
      .map((member) => {
        const value = member.getText();
        const stripQuotesAndBackticks = value.replace(/['"`]/g, '').replace(/`/g, '');
        const splitOnCommaAndReturn = stripQuotesAndBackticks.split(',\n');

        return splitOnCommaAndReturn
          .map((v) => {
            const trimmed = v.trim();
            const splitOnEquals = trimmed.split('=');
            return `"${splitOnEquals[1].trim()}"`;
          })
          .join(` | `);
      });

    return values.join(` | `);
  }

  // If the type is an alias (e.g., `Action`), resolve its declaration
  const aliasSymbol = type.getAliasSymbol();
  if (aliasSymbol) {
    const aliasType = type.getSymbol()?.getDeclarations()?.[0]?.getType();
    if (aliasType) {
      return resolveType(aliasType, visitedTypes);
    }
  }

  // Step 2: If it's a union type, resolve each member recursively
  if (type.isUnion()) {
    return type
      .getUnionTypes()
      .map((t) => resolveType(t, visitedTypes))
      .join(' | ');
  }

  // Step 3: If it's a string literal type, return its literal value
  if (type.isStringLiteral()) {
    return `"${type.getLiteralValue()}"`;
  }

  return type.getText(); // Default to the type's text representation
}

export interface JSDocMetadata {
  description?: string;
  owner?: string;
}

/**
 * Extracts description and owner from a JSDoc comment.
 *
 * @param docs JSDoc comment nodes to extract metadata from
 * @returns Metadata extracted from the JSDoc comments
 */
export function getMetadataFromJSDocs(docs: JSDoc[]): JSDocMetadata {
  let description: string | undefined;
  let owner: string | undefined;

  if (docs.length > 1) {
    // TODO: Do we need to handle multiple JSDoc comments? Why would there be more than one?
    throw new Error('Expected only one JSDoc comment');
  }

  for (const doc of docs) {
    const desc = trimString(doc.getDescription());
    if (desc) {
      description = desc;
    }

    const tags = doc.getTags();
    for (const tag of tags) {
      if (tag.getTagName() === 'owner') {
        const tagText = tag.getCommentText();
        owner = tagText && trimString(tagText);
      }
    }
  }

  return { description, owner };
}

function trimString(str: string): string {
  return str.trim().replace(/\n/g, ' ');
}
