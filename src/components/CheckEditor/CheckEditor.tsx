import React, { PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Stack, Tab, TabsBar, useSplitter, useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { AdhocTestResults } from '../AdhocTestResults';
import { useCheckEditorApi } from './CheckEditor.hooks';
import { useCheckEditorContext } from './CheckEditorContext';
import { CheckEditorSectionNavigation } from './CheckEditorSectionNavigation';
import { FormRoot } from './FormRoot';
import { FORM_CONTAINER_NAME } from './FormRoot.constants';
import { FormSections } from './FormSections';

// Note: children can be used to override the default form sections, e.g. for testing
export function CheckEditor({ children }: PropsWithChildren) {
  const styles = useStyles2(getStyles);

  const {
    containerProps: { className: containerClassName, ...containerProps },
    primaryProps: { className: primaryClassName, ...primaryProps },
    secondaryProps,
    splitterProps: { className, ...splitterProps },
  } = useSplitter({
    direction: 'row',
    initialSize: 0.7,
    dragPosition: 'start',
    handleSize: 'md',
  });

  const { adhocCheckResponse, adhocCheckResponseError } = useCheckEditorContext();

  const { error } = useCheckEditorApi();

  const alerts = (error || adhocCheckResponseError) && (
    <Stack direction={`column`}>
      {error && (
        <Alert title="Save failed" severity="error">
          {error.message}
        </Alert>
      )}
      {adhocCheckResponseError && (
        <Alert title="Test failed" severity="error">
          {adhocCheckResponseError.message}
        </Alert>
      )}
    </Stack>
  );

  return (
    <div
      data-testid={DataTestIds.CHECK_EDITOR}
      {...containerProps}
      className={cx(containerClassName, styles.container)}
    >
      <div className={cx(primaryClassName, styles.primarySection)} {...primaryProps}>
        <EditorSection main header={<CheckEditorSectionNavigation />}>
          <FormRoot alerts={alerts}>
            {!children && <FormSections />}
            {!!children && children}
          </FormRoot>
        </EditorSection>
      </div>
      <div className={cx(className, styles.splitter)} {...splitterProps} />
      <div {...secondaryProps}>
        <EditorSection
          header={
            <div
              className={css`
                display: flex;
                align-items: flex-end;
                height: 100%;
                position: relative;
                left: -16px;
                right: 0;
                flex-grow: 1;
              `}
            >
              <TabsBar
                className={css`
                  border-bottom: none;
                `}
              >
                <Tab label="Test preview" active />
                <Tab label="Docs" />
              </TabsBar>
            </div>
          }
        >
          <AdhocTestResults testResponse={adhocCheckResponse} />
        </EditorSection>
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    primarySection: css`
      container-name: ${FORM_CONTAINER_NAME};
      container-type: inline-size;
      display: flex;
      height: 100%;
      flex-grow: 1;
    `,
    container: css`
      height: 100%;
      border: 1px solid ${theme.colors.border.medium};
    `,
    splitter: css`
      &::before {
        border-right: 1px solid ${theme.colors.border.medium};
      }
    `,
  };
}

interface EditorSectionProps extends PropsWithChildren {
  header?: ReactNode;
  main?: boolean;
}

function EditorSection({ header, children, main = false }: EditorSectionProps) {
  const theme = useTheme2();
  const hasHeader = header !== undefined;

  return (
    <div
      className={cx(
        css`
          height: 100%;
          display: flex;
          flex-direction: column;
          width: 100%;
        `,
        main && 'CheckEditor__main-content'
      )}
    >
      {hasHeader && (
        <div
          className={css`
            height: 56px;
            border-bottom: 1px solid ${theme.colors.border.medium};
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
            .CheckEditor__main-content & {
              // This is needed to fill the gap between the main content and the splitter
              &::after {
                display: block;
                content: ' ';
                position: absolute;
                width: 16px;
                height: 56px; // important to use px here, to not cause pixel shifting when resizing
                border-bottom: 1px solid ${theme.colors.border.medium};
                top: 0;
                right: -16px;
                bottom: -1px;
                pointer-events: none;
              }
            }
            &:not(.CheckEditor__main-content &) {
            }
          `}
        >
          {header}
        </div>
      )}
      <div
        className={css`
          flex: 1 1 0;
          overflow: auto;
        `}
      >
        {children}
      </div>
    </div>
  );
}
