import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { CodeEditor as GrafanaCodeEditor, Spinner } from '@grafana/ui';
import { css } from '@emotion/css';
import { ConstrainedEditorInstance } from 'constrained-editor-plugin';
import type * as monacoType from 'monaco-editor/esm/vs/editor/editor.api';

import { CodeEditorProps, ConstrainedEditorProps } from './CodeEditor.types';
// import { Overlay } from 'components/Overlay';
import k6Types from './k6.types';

import { useK6TypesForChannel } from './k6TypesLoader/useK6TypesForChannel';
import { initializeConstrainedInstance, updateConstrainedEditorRanges } from './CodeEditor.utils';
import { wireCustomValidation } from './monacoValidation';

let currentK6LibUris: string[] = [];

const clearK6Types = (monaco: typeof monacoType) => {
  // Clear previously added k6 libraries
  currentK6LibUris.forEach((uri) => {
    try {
      // Override with empty content to effectively remove
      monaco.languages.typescript.javascriptDefaults.addExtraLib('', uri);
    } catch (error) {
      // Ignore errors
    }
  });
  currentK6LibUris = [];
};

const addK6Types = (monaco: typeof monacoType, types: Record<string, string> = k6Types) => {
  // Clear existing k6 types first
  clearK6Types(monaco);

  // Add new k6 types
  Object.entries(types).forEach(([name, type]) => {
    const uri = `file:///k6-types/${name.replace(/\//g, '-')}.d.ts`;
    monaco.languages.typescript.javascriptDefaults.addExtraLib(`declare module '${name}' { ${type} }`, uri);
    currentK6LibUris.push(uri);
  });

  // Add remote imports support
  const httpsUri = 'file:///k6-types/https-imports.d.ts';
  monaco.languages.typescript.javascriptDefaults.addExtraLib("declare module 'https://*'", httpsUri);
  currentK6LibUris.push(httpsUri);
};
const containerStyles = css`
  // Background styling for editable ranges (multi)
  .editableArea--multi-line {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const MIN_EDITOR_HEIGHT = 400;
const editorWrapperStyles = css`
  position: relative;
`;

const loadingOverlayStyles = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  z-index: 1000;
  pointer-events: none;
`;

export const CodeEditor = forwardRef(function CodeEditor(
  {
    checkJs = true,
    constrainedRanges,
    id,
    k6Channel,
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

  const isJs = language === 'javascript';
  const [prevValue, setPrevValue] = useState(value);
  const [editorHeight, setEditorHeight] = useState(600); // Initial height

  // Layout editor when height changes
  useEffect(() => {
    if (editorRef) {
      editorRef.layout();
    }
  }, [editorHeight, editorRef]);

  const { types: dynamicK6Types, loading: k6TypesLoading, error: k6TypesError } = useK6TypesForChannel(k6Channel, isJs);

  const shouldWaitForTypes = k6Channel && isJs && k6TypesLoading && !k6TypesError;

  // Update Monaco types when dynamic types change
  useEffect(() => {
    if (editorRef && dynamicK6Types) {
      const monaco = (window as any).monaco;
      if (monaco) {
        addK6Types(monaco, dynamicK6Types);
      }
    }
  }, [dynamicK6Types, editorRef]);

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

    addK6Types(monaco, dynamicK6Types || k6Types);

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

    // Observe the container for resizing changes
    const parentContainer = editor.getDomNode()?.parentElement;
    const resizeObserver = parentContainer
      ? new ResizeObserver(() => {
          editor.layout();
        })
      : null;

    if (resizeObserver && parentContainer) {
      resizeObserver.observe(parentContainer);
    }

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
      resizeObserver?.disconnect();
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
    <div data-fs-element="Code editor" id={id} {...rest} className={editorWrapperStyles}>
      {renderHeader && renderHeader({ scriptValue: value })}
      {shouldWaitForTypes && (
        <div className={loadingOverlayStyles}>
          <Spinner />
        </div>
      )}
      <GrafanaCodeEditor
        key={dynamicK6Types ? 'types-loaded' : 'types-loading'}
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
