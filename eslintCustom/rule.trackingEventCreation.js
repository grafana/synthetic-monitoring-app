// @ts-check
const { ESLintUtils, AST_NODE_TYPES } = require('@typescript-eslint/utils');

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/grafana/grafana/blob/main/packages/grafana-eslint-rules/README.md#${name}`
);

const trackingEventCreation = createRule({
  create(context) {
    // Track what name createSMEventFactory is imported as
    let createSMEventFactoryName = 'createSMEventFactory';
    // Track if createSMEventFactory is imported
    let iscreateSMEventFactoryImported = false;
    // Track variables that store createSMEventFactory calls
    const eventFactoryVariables = new Set();

    return {
      ImportSpecifier(node) {
        if (node.imported.type === AST_NODE_TYPES.Identifier && node.imported.name === 'createSMEventFactory') {
          // Remember what name it was imported as (handles aliased imports)
          createSMEventFactoryName = node.local.name;
          iscreateSMEventFactoryImported = true;
        }
      },
      VariableDeclarator(node) {
        if (!iscreateSMEventFactoryImported) {
          return;
        }
        // Track variables initialized with createSMEventFactory calls
        if (
          node.init?.type === AST_NODE_TYPES.CallExpression &&
          node.init.callee.type === AST_NODE_TYPES.Identifier &&
          node.init.callee.name === createSMEventFactoryName
        ) {
          const variableName = node.id.type === AST_NODE_TYPES.Identifier && node.id.name;
          if (variableName) {
            eventFactoryVariables.add(variableName);
          }

          // Check if arguments are literals
          const args = node.init.arguments;
          const argsAreNotLiterals = args.some((arg) => arg.type !== AST_NODE_TYPES.Literal);
          if (argsAreNotLiterals) {
            return context.report({
              node: node.init,
              messageId: 'eventFactoryLiterals',
            });
          }
        }
      },
      ExportNamedDeclaration(node) {
        if (!iscreateSMEventFactoryImported) {
          return;
        }
        if (
          node.declaration?.type === AST_NODE_TYPES.VariableDeclaration &&
          node.declaration.declarations[0].init?.type === AST_NODE_TYPES.CallExpression
        ) {
          const callee = node.declaration.declarations[0].init.callee;
          if (callee.type === AST_NODE_TYPES.Identifier && eventFactoryVariables.has(callee.name)) {
            // Check for comments
            const comments = context.sourceCode.getCommentsBefore(node);

            if (!comments || comments.length === 0) {
              return context.report({
                node,
                messageId: 'missingFunctionComment',
              });
            }

            const jsDocComment = comments.find((comment) => comment.value.slice(0, 1) === '*');

            if (!jsDocComment) {
              return context.report({
                node,
                messageId: 'missingJsDocComment',
              });
            }
          }
        }
      },
      TSInterfaceDeclaration(node) {
        if (!iscreateSMEventFactoryImported) {
          return;
        }
        // Check if interface extends TrackingEvent
        let extendsTrackingEvent = false;
        if (node.extends && node.extends.length > 0) {
          const interfaceExtends = node.extends;
          extendsTrackingEvent = interfaceExtends.some((extend) => {
            return (
              extend.expression.type === AST_NODE_TYPES.Identifier && extend.expression.name === 'TrackingEventProps'
            );
          });
        }
        if (!node.extends || !extendsTrackingEvent) {
          return context.report({
            node,
            messageId: 'interfaceMustExtend',
          });
        }
        //Check if the interface properties has comments
        if (node.body.type === AST_NODE_TYPES.TSInterfaceBody) {
          const properties = node.body.body;
          properties.forEach((property) => {
            const comments = context.sourceCode.getCommentsBefore(property);

            if (!comments || comments.length === 0) {
              return context.report({
                node: property,
                messageId: 'missingPropertyComment',
              });
            }

            const jsDocComment = comments.find((comment) => comment.value.slice(0, 1) === '*');

            if (!jsDocComment) {
              return context.report({
                node: property,
                messageId: 'missingJsDocComment',
              });
            }
          });
        }
      },
      TSTypeAliasDeclaration(node) {
        if (!iscreateSMEventFactoryImported) {
          return;
        }
        // Check if types has comments
        const comments = context.sourceCode.getCommentsBefore(node);

        if (!comments || comments.length === 0) {
          return context.report({
            node,
            messageId: 'missingPropertyComment',
          });
        }
      },
    };
  },
  name: 'tracking-event-creation',
  meta: {
    type: 'problem',
    docs: {
      description: 'Check that the tracking event is created in the right way',
    },
    messages: {
      eventFactoryLiterals: 'Params passed to `createSMEventFactory` must be literals',
      missingFunctionComment: 'Event function needs to have a description of its purpose',
      missingPropertyComment: 'Event property needs to have a description of its purpose',
      interfaceMustExtend: 'Interface must extend `TrackingEvent`',
      missingJsDocComment: 'Comment needs to be a jsDoc comment (begin comment with `*`)',
    },
    schema: [],
  },
  defaultOptions: [],
});

module.exports = trackingEventCreation;
