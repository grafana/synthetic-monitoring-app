import type * as monacoType from 'monaco-editor/esm/vs/editor/editor.api';
import { findRuleViolations } from 'schemas/forms/script/rules';

const OWNER = 'sm-custom-validation';

export function applyCustomScriptMarkers(monaco: typeof monacoType, model: monacoType.editor.ITextModel) {
  const script = model.getValue();
  const violations = findRuleViolations(script);

  const markers: monacoType.editor.IMarkerData[] = violations.map(({ startIndex, endIndex, message }) => {
    const start = model.getPositionAt(startIndex);
    const end = model.getPositionAt(endIndex);
    return {
      severity: monaco.MarkerSeverity.Error,
      message,
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: end.lineNumber,
      endColumn: end.column,
      source: 'Synthetic Monitoring',
    };
  });

  monaco.editor.setModelMarkers(model, OWNER, markers);
}

export function wireCustomValidation(monaco: typeof monacoType, editor: monacoType.editor.IStandaloneCodeEditor) {
  const model = editor.getModel();
  if (!model) {
    return;
  }

  // Initial run
  applyCustomScriptMarkers(monaco, model);

  // Update on content changes
  const d1 = editor.onDidChangeModelContent(() => {
    const currentModel = editor.getModel();
    if (currentModel) {
      applyCustomScriptMarkers(monaco, currentModel);
    }
  });

  // Update when model changes
  const d2 = editor.onDidChangeModel(() => {
    const currentModel = editor.getModel();
    if (currentModel) {
      applyCustomScriptMarkers(monaco, currentModel);
    }
  });

  return () => {
    d1.dispose();
    d2.dispose();
  };
}
