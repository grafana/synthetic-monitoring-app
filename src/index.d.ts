declare module 'react-leaflet';
declare module 'body-parser';
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
  export default constrainedEditor;
}

// We need this import because of https://github.com/grafana/grafana/issues/26512
import {} from '@emotion/core';

// This is a monkey patch of the default Object.keys() typing that casts the return type to be a keyof the original object, instead of a string. https://fettblog.eu/typescript-better-object-keys/
type ObjectKeys<T> = T extends object
  ? Array<keyof T>
  : T extends number
  ? []
  : T extends any[] | string
  ? string[]
  : never;

interface ObjectConstructor {
  keys<T>(o: T): ObjectKeys<T>;
}
