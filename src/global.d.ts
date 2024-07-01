declare module 'grafana/app/core/app_events';

declare module 'constrained-editor-plugin' {
  import { monacoTypes } from '@grafana/ui';

  type Range = [number, number, number, number] | number[];
  type EditableRangesMap = Record<string, RestrictionObject>;
  type ValueMap = Record<string, string>;

  export interface RestrictionObject {
    label: string;
    range: Range;
    value: string;
    allowMultiline?: boolean;
    validate?: (currentValue: string, currentRange: Range, info: any) => boolean;
  }

  export interface ConstrainedModel extends monacoTypes.editor.ITextModel {
    editInRestrictedArea: boolean;
    getCurrentEditableRanges: () => EditableRangesMap;
    getValueInEditableRanges: () => ValueMap;
    disposeRestrictions: () => void;
    onDidChangeContentInEditableRange: (
      callback: (currentChanges: any, allChanges: any, currentRanges: EditableRangesMap) => void
    ) => void;
    updateRestrictions: (ranges: RestrictionObject[]) => void;
    updateValueInEditableRanges: (object: ValueMap, forceMoveMarkers?: boolean) => void;
    toggleHighlightOfEditableAreas: () => void;
  }

  export interface ConstrainedEditorInstance {
    initializeIn: (editor: monacoTypes.editor.IStandaloneCodeEditor) => boolean | never;
    addRestrictionsTo: (model: monacoTypes.editor.ITextModel, ranges: RestrictionObject[]) => ConstrainedModel;
    removeRestrictionsIn: () => boolean | never;
    disposeConstrainer: () => boolean;
    toggleDevMode: () => void;
  }

  export declare function constrainedEditor(monaco: typeof monacoTypes): ConstrainedEditorInstance;
  // eslint-disable-next-line no-restricted-syntax
  export default constrainedEditor;
}

declare module '*?raw' {
  const content: string;
  // eslint-disable-next-line no-restricted-syntax
  export default content;
}
