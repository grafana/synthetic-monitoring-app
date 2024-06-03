import React, { forwardRef, useEffect, useState } from 'react';
import { CodeEditor as GrafanaCodeEditor } from '@grafana/ui';
import { css } from '@emotion/css';
import { ConstrainedEditorInstance } from 'constrained-editor-plugin';
import type * as monacoType from 'monaco-editor/esm/vs/editor/editor.api';

import { CodeEditorProps, ConstrainedEditorProps } from './CodeEditor.types';
// import { Overlay } from 'components/Overlay';
import k6Types from './k6.types';

import { initializeConstrainedInstance, updateConstrainedEditorRanges } from './CodeEditor.utils';

const addK6Types = (monaco: typeof monacoType) => {
  Object.entries(k6Types).map(([name, type]) => {
    // Import types as modules for code completions
    monaco.languages.typescript.javascriptDefaults.addExtraLib(`declare module '${name}' { ${type} }`);
  });

  // Remove TS errors for remote libs imports
  monaco.languages.typescript.javascriptDefaults.addExtraLib("declare module 'https://*'");
};
const containerStyles = css`
  min-height: 600px;

  & > div {
    min-height: 600px;

    > section {
      min-height: 600px;
    }
  }

  // Background styling for editable ranges (multi)
  .editableArea--multi-line {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

export const CodeEditor = forwardRef(function CodeEditor(
  {
    checkJs = true,
    constrainedRanges,
    language = 'javascript',
    readOnly,
    renderHeader,
    value,
    onBeforeEditorMount,
    onChange,
    onDidChangeContentInEditableRange,
    onValidation,
  }: CodeEditorProps & ConstrainedEditorProps,
  ref
) {
  const [editorRef, setEditorRef] = useState<null | monacoType.editor.IStandaloneCodeEditor>(null);
  const [constrainedInstance, setConstrainedInstance] = useState<null | ConstrainedEditorInstance>(null);
  const [prevValue, setPrevValue] = useState(value);

  // GC
  // useEffect(() => {
  //   return () => {
  //     if (constrainedInstance) {
  //       constrainedInstance.disposeConstrainer();
  //     }

  //     if (editorRef) {
  //       editorRef.dispose();
  //     }
  //   };
  //   // eslint-disable-next-line
  // }, []);

  const handleValidation = (monaco: typeof monacoType, editor: monacoType.editor.IStandaloneCodeEditor) => {
    if (!onValidation) {
      return;
    }

    const markers = monaco.editor.getModelMarkers({});
    const hasError = markers.some((marker) => marker.severity > 1);
    const value = editor.getValue();
    onValidation(hasError, value);
  };

  const handleBeforeEditorMount = async (monaco: typeof monacoType) => {
    await onBeforeEditorMount?.(monaco);
    addK6Types(monaco);

    const compilerOptions = monaco.languages.typescript.javascriptDefaults.getCompilerOptions();
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      ...compilerOptions,
      checkJs, // show errors for JS files, by default it check only TS
    });

    // Needed to make `checkJs` work and highlight errors
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSyntaxValidation: false,
      noSemanticValidation: false,
      noSuggestionDiagnostics: false,
    });
  };

  const handleEditorDidMount = (editor: monacoType.editor.IStandaloneCodeEditor, monaco: typeof monacoType) => {
    setEditorRef(editor);

    monaco.editor.onDidChangeMarkers(() => {
      handleValidation(monaco, editor);
    });

    if (constrainedRanges) {
      const instance = initializeConstrainedInstance(monaco, editor);
      const model = editor.getModel();
      if (!model) {
        return;
      }

      updateConstrainedEditorRanges(instance, model, value, constrainedRanges, onDidChangeContentInEditableRange);
      setConstrainedInstance(instance);
    }
  };

  useEffect(() => {
    if (constrainedRanges && constrainedInstance) {
      const model = editorRef?.getModel();
      if (!model || prevValue === value) {
        return;
      }
      if (
        updateConstrainedEditorRanges(
          constrainedInstance,
          model,
          value,
          constrainedRanges,
          onDidChangeContentInEditableRange
        )
      ) {
        setPrevValue(value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, constrainedRanges]);

  return (
    <div data-fs-element="Code editor">
      {renderHeader && renderHeader({ scriptValue: value })}
      {/* {overlayMessage && <Overlay>{overlayMessage}</Overlay>} */}
      <GrafanaCodeEditor
        value={value}
        language={language}
        showLineNumbers={true}
        showMiniMap={false}
        monacoOptions={{
          fixedOverflowWidgets: false,
          scrollBeyondLastLine: false,
          scrollbar: {
            alwaysConsumeMouseWheel: false,
          },
        }}
        //@ts-ignore The onChange prop works by the type def doesn't believe it exists
        onChange={onChange}
        onBeforeEditorMount={handleBeforeEditorMount}
        onEditorDidMount={handleEditorDidMount}
        readOnly={readOnly}
        containerStyles={containerStyles}
      />
    </div>
  );
});
