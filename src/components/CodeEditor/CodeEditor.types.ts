import { ReactNode } from 'react'
import type * as monacoType from 'monaco-editor/esm/vs/editor/editor.api'
import { RestrictionObject } from 'constrained-editor-plugin'

export interface CodeEditorProps {
  checkJs?: boolean
  language?: 'javascript' | 'json' | 'text'
  readOnly?: boolean
  renderHeader?: ({ scriptValue }: { scriptValue: string }) => ReactNode
  overlayMessage?: ReactNode
  value: string
  onBeforeEditorMount?: (monaco: typeof monacoType) => void
  onChange?: (value: string) => void
  onValidation?: (hasError: boolean, value: string) => void
}

export interface ConstrainedEditorProps {
  constrainedRanges?: RestrictionObject[]
  onDidChangeContentInEditableRange?: (...params: any) => void
}
