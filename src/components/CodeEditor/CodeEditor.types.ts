import { ReactNode } from 'react';
import { RestrictionObject } from 'constrained-editor-plugin';
import type * as monacoType from 'monaco-editor/esm/vs/editor/editor.api';

export interface CodeEditorProps {
  checkJs?: boolean;
  id?: string;
  language?: 'javascript' | 'json' | 'text';
  onBeforeEditorMount?: (monaco: typeof monacoType) => void;
  onChange?: (value: string) => void;
  onValidation?: (hasError: boolean, value: string) => void;
  overlayMessage?: ReactNode;
  readOnly?: boolean;
  renderHeader?: ({ scriptValue }: { scriptValue: string }) => ReactNode;
  value: string;
}

export interface ConstrainedEditorProps {
  constrainedRanges?: RestrictionObject[];
  onDidChangeContentInEditableRange?: (...params: any) => void;
}
