import constrainedEditor, {
  ConstrainedModel,
  ConstrainedEditorInstance,
  RestrictionObject,
} from 'constrained-editor-plugin';
import * as monacoType from 'monaco-editor';

// Get value map from restrictions array
// Used for updating restriction values
export function getValueMapFromRestrictions(restrictions: RestrictionObject[]) {
  const valueMap: Record<string, string> = {};
  for (const { label, value } of restrictions) {
    valueMap[label] = value;
  }

  return valueMap;
}

type EditableRangesMap = Record<string, RestrictionObject>;

export function initializeConstrainedInstance(
  monaco: typeof monacoType,
  editor: monacoType.editor.IStandaloneCodeEditor
) {
  const instance = constrainedEditor(monaco);
  instance.initializeIn(editor);

  return instance;
}

export function addEditableRanges(
  constrainedEditorInstance: ConstrainedEditorInstance,
  model: ConstrainedModel | monacoType.editor.ITextModel,
  ranges: RestrictionObject[],
  onDidChangeContentInEditableRange?: (currentChanges: any, allChanges: any, currentRanges: EditableRangesMap) => void
) {
  const constrainedModel = constrainedEditorInstance.addRestrictionsTo(model, ranges);
  constrainedModel.updateValueInEditableRanges(getValueMapFromRestrictions(ranges));
  if (typeof onDidChangeContentInEditableRange === 'function') {
    constrainedModel.onDidChangeContentInEditableRange(onDidChangeContentInEditableRange);
  }
}

export function updateConstrainedEditorRanges(
  constrainedEditorInstance: ConstrainedEditorInstance,
  model: ConstrainedModel | monacoType.editor.ITextModel,
  value: string,
  ranges: RestrictionObject[],
  onDidChangeContentInEditableRange?: (currentChanges: any, allChanges: any, currentRanges: EditableRangesMap) => void
) {
  if ('disposeRestrictions' in model) {
    model.disposeRestrictions();
  }
  model.setValue(value);
  try {
    addEditableRanges(constrainedEditorInstance, model, ranges, onDidChangeContentInEditableRange);
    return true;
  } catch (error) {
    return false;
  }
}
