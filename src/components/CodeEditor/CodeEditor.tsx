import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { CodeEditor as GrafanaCodeEditor } from '@grafana/ui';
import { css } from '@emotion/css';
import { ConstrainedEditorInstance } from 'constrained-editor-plugin';
import type * as monacoType from 'monaco-editor/esm/vs/editor/editor.api';

import { CodeEditorProps, ConstrainedEditorProps } from './CodeEditor.types';
// import { Overlay } from 'components/Overlay';
import k6Types from './k6.types';

import { initializeConstrainedInstance, updateConstrainedEditorRanges } from './CodeEditor.utils';
import { wireCustomValidation } from './monacoValidation';

const addK6Types = (monaco: typeof monacoType) => {
  Object.entries(k6Types).map(([name, type]) => {
    // Import types as modules for code completions
    monaco.languages.typescript.javascriptDefaults.addExtraLib(`declare module '${name}' { ${type} }`);
  });

  // Remove TS errors for remote libs imports
  monaco.languages.typescript.javascriptDefaults.addExtraLib("declare module 'https://*'");
};
const containerStyles = css`
  // Background styling for editable ranges (multi)
  .editableArea--multi-line {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const MIN_EDITOR_HEIGHT = 400;

export const CodeEditor = forwardRef(function CodeEditor(
  {
    checkJs = true,
    constrainedRanges,
    id,
    language = 'javascript',
    onBeforeEditorMount,
    onChange,
    onDidChangeContentInEditableRange,
    onValidation,
    overlayMessage,
    readOnly,
    renderHeader,
    value,
    ...rest // Allow for custom data-attributes
  }: CodeEditorProps & ConstrainedEditorProps,
  ref
) {
  const [editorRef, setEditorRef] = useState<null | monacoType.editor.IStandaloneCodeEditor>(null);
  const [constrainedInstance, setConstrainedInstance] = useState<null | ConstrainedEditorInstance>(null);
  const [prevValue, setPrevValue] = useState(value);
  const [editorHeight, setEditorHeight] = useState(600); // Initial height

  // Layout editor when height changes
  useEffect(() => {
    if (editorRef) {
      editorRef.layout();
    }
  }, [editorHeight, editorRef]);

  // GC
  useEffect(() => {
    return () => {
      if (constrainedInstance) {
        constrainedInstance.disposeConstrainer();
      }

      if (editorRef) {
        editorRef.dispose();
      }
    };
    // eslint-disable-next-line
  }, []);

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
      checkJs, // show errors for JS files; by default, it checks only TS

      // To allow for top-level await (a combination of `target` and `module` options is required).
      target: monaco.languages.typescript.ScriptTarget.ESNext, // Was ESNext by default, now it's set explicitly.
      module: monaco.languages.typescript.ModuleKind.ESNext,
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

    // Wire custom red-squiggle markers for forbidden syntax
    const disposeCustomValidation = wireCustomValidation(monaco, editor);

    // Auto-resize editor based on content for native scroll
    const updateEditorHeight = () => {
      const contentHeight = editor.getContentHeight();
      setEditorHeight(Math.max(contentHeight, MIN_EDITOR_HEIGHT));
    };

    // Update height on content changes
    const disposeSizeChange = editor.onDidContentSizeChange(updateEditorHeight);
    
    // Set initial height
    updateEditorHeight();

    if (constrainedRanges) {
      const instance = initializeConstrainedInstance(monaco, editor);
      const model = editor.getModel();
      if (!model) {
        return;
      }

      updateConstrainedEditorRanges(instance, model, value, constrainedRanges, onDidChangeContentInEditableRange);
      setConstrainedInstance(instance);
    }

    // Cleanup subscriptions on dispose
    editor.onDidDispose(() => {
      if (typeof disposeCustomValidation === 'function') {
        disposeCustomValidation();
      }
      disposeSizeChange.dispose();
    });
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

  const editorContainerStyles = useMemo(
    () => css`
      ${containerStyles}
      height: ${editorHeight}px;
      min-height: ${MIN_EDITOR_HEIGHT}px;
    `,
    [editorHeight]
  );

  return (
    <div data-fs-element="Code editor" id={id} {...rest}>
      {renderHeader && renderHeader({ scriptValue: value })}
      {/* {overlayMessage && <Overlay>{overlayMessage}</Overlay>} */}
      <GrafanaCodeEditor
        value={value}
        language={language}
        showLineNumbers={true}
        showMiniMap={false}
        monacoOptions={{
          automaticLayout: false,
          fixedOverflowWidgets: false,
          scrollBeyondLastLine: false,
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden',
            alwaysConsumeMouseWheel: false,
          },
        }}
        onChange={onChange}
        onBeforeEditorMount={handleBeforeEditorMount}
        onEditorDidMount={handleEditorDidMount}
        readOnly={readOnly}
        containerStyles={editorContainerStyles}
      />
    </div>
  );
});
