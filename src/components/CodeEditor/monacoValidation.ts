import { Node, parse } from 'acorn';
import type * as monacoType from 'monaco-editor/esm/vs/editor/editor.api';
import { K6_EXTENSION_MESSAGE, K6_PRAGMA_MESSAGE,validateK6Restrictions } from 'schemas/forms/script/rules';

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

type Monaco = typeof monacoType;
type Editor = monacoType.editor.IStandaloneCodeEditor;
type Model = monacoType.editor.ITextModel;
type Marker = monacoType.editor.IMarkerData;

interface ValidationIssue {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  code: string;
}

const VALIDATION_CONFIG = {
  OWNER: 'k6-validation',
  PRAGMA_ERROR: K6_PRAGMA_MESSAGE,
  EXTENSION_ERROR: K6_EXTENSION_MESSAGE,
  PRAGMA_CODE: 'k6-pragma-forbidden',
  EXTENSION_CODE: 'k6-extension-forbidden',
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function parseScript(script: string): Node | null {
  try {
    return parse(script, {
      ecmaVersion: 2023,
      sourceType: 'module',
      locations: true, // Enable locations for Monaco validation
    });
  } catch (e) {
    return null;
  }
}

function getMonacoPosition(model: Model, loc: { line: number; column: number }) {
  return {
    lineNumber: loc.line,
    column: loc.column + 1, // Monaco is 1-based, Acorn is 0-based
  };
}

// =============================================================================
// VALIDATION LOGIC
// =============================================================================

function createValidationIssue(
  model: Model,
  node: Node,
  message: string,
  code: string
): ValidationIssue | null {
  if (!node.loc) {
    return null; // Skip nodes without location info
  }

  const start = getMonacoPosition(model, node.loc.start);
  const end = getMonacoPosition(model, node.loc.end);

  return {
    startLineNumber: start.lineNumber,
    startColumn: start.column,
    endLineNumber: end.lineNumber,
    endColumn: end.column,
    message,
    code,
  };
}

function findK6ValidationIssues(model: Model): ValidationIssue[] {
  const script = model.getValue();
  const validation = validateK6Restrictions(script, parseScript);

  // Convert shared validation issues to Monaco validation issues with location info
  return validation.issues.map(sharedIssue => {
    const issue = createValidationIssue(
      model,
      sharedIssue.node,
      sharedIssue.message,
      sharedIssue.code
    );
    return issue;
  }).filter((issue): issue is ValidationIssue => issue !== null);
}

function createMarkers(issues: ValidationIssue[], monaco: Monaco): Marker[] {
  return issues.map((issue) => ({
    severity: monaco.MarkerSeverity.Error,
    message: issue.message,
    startLineNumber: issue.startLineNumber,
    startColumn: issue.startColumn,
    endLineNumber: issue.endLineNumber,
    endColumn: issue.endColumn,
    source: 'Synthetic Monitoring',
    code: issue.code,
  }));
}

// =============================================================================
// QUICK FIX ACTIONS
// =============================================================================

function createRemoveLineAction(
  monaco: Monaco,
  model: Model,
  marker: Marker,
  title: string
): monacoType.languages.CodeAction {
  return {
    title,
    diagnostics: [marker],
    kind: 'quickfix',
    edit: {
      edits: [
        {
          resource: model.uri,
          textEdit: {
            range: new monaco.Range(
              marker.startLineNumber,
              1,
              marker.startLineNumber,
              model.getLineContent(marker.startLineNumber).length + 1
            ),
            text: '',
          },
          versionId: model.getVersionId(),
        },
      ],
    },
    isPreferred: true,
  };
}

function getK6ValidationMarkers(context: monacoType.languages.CodeActionContext, monaco: Monaco): Marker[] {
  return (Array.isArray(context.markers) ? context.markers : []).filter(
    (marker) =>
      (marker.message === VALIDATION_CONFIG.PRAGMA_ERROR || marker.message === VALIDATION_CONFIG.EXTENSION_ERROR) &&
      marker.severity === monaco.MarkerSeverity.Error
  );
}

function createQuickFixActions(monaco: Monaco, model: Model, markers: Marker[]): monacoType.languages.CodeAction[] {
  return markers.map((marker) => {
    if (marker.message === VALIDATION_CONFIG.PRAGMA_ERROR) {
      return createRemoveLineAction(monaco, model, marker, 'Remove k6 version directive');
    }
    if (marker.message === VALIDATION_CONFIG.EXTENSION_ERROR) {
      return createRemoveLineAction(monaco, model, marker, 'Remove k6 extension import');
    }
    return createRemoveLineAction(monaco, model, marker, 'Remove forbidden k6 statement');
  });
}

function registerCodeActionProvider(monaco: Monaco) {
  return monaco.languages.registerCodeActionProvider('javascript', {
    provideCodeActions(model, range, context, token) {
      const k6Markers = getK6ValidationMarkers(context, monaco);
      const actions = createQuickFixActions(monaco, model, k6Markers);

      return { actions, dispose: () => {} };
    },
  });
}

// =============================================================================
// PUBLIC API
// =============================================================================

export function applyCustomScriptMarkers(monaco: Monaco, model: Model): void {
  const issues = findK6ValidationIssues(model);
  const markers = createMarkers(issues, monaco);
  monaco.editor.setModelMarkers(model, VALIDATION_CONFIG.OWNER, markers);
}

export function wireCustomValidation(monaco: Monaco, editor: Editor) {
  const model = editor.getModel();
  if (!model) {
    return;
  }

  // Register quick fix provider
  const codeActionDisposable = registerCodeActionProvider(monaco);

  // Apply initial validation
  applyCustomScriptMarkers(monaco, model);

  // Update validation on changes
  const disposeOnChangeModelContent = editor.onDidChangeModelContent(() => {
    const currentModel = editor.getModel();
    if (currentModel) {
      applyCustomScriptMarkers(monaco, currentModel);
    }
  });

  const disposeOnChangeModel = editor.onDidChangeModel(() => {
    const currentModel = editor.getModel();
    if (currentModel) {
      applyCustomScriptMarkers(monaco, currentModel);
    }
  });

  // Cleanup function
  return () => {
    disposeOnChangeModelContent.dispose();
    disposeOnChangeModel.dispose();
    codeActionDisposable.dispose();
  };
}
