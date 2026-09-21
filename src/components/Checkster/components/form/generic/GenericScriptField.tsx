import React, { useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { ConfirmModal, FieldValidationMessage, Icon, Modal, Text, useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackExampleScriptSelected } from 'features/tracking/checkFormEvents';

import { CheckFormFieldPath } from '../../../types';
import { CheckFormValues, K6Channel } from 'types';
import { CodeEditor } from 'components/CodeEditor';

import { ExampleScript } from '../../../../ScriptExamplesMenu/constants';
import { getFieldErrorProps } from '../../../utils/form';
import { Column } from '../../ui/Column';
import { ScriptEditorToolbar } from './ScriptEditorToolbar';

interface GenericScriptFieldProps {
  field: CheckFormFieldPath;
  examples?: ExampleScript[];
  description?: string;
}

export function GenericScriptField({ field, examples, description }: GenericScriptFieldProps) {
  const {
    control,
    getValues,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();

  const fieldErrorProps = getFieldErrorProps(errors, field);

  const theme = useTheme2();
  const styles = useStyles2(getStyles);

  const k6Channel = getValues('channels.k6') as K6Channel | undefined;
  const k6ChannelId = k6Channel?.id;
  const isDeprecatedChannel = !!k6Channel && new Date(k6Channel.deprecatedAfter) < new Date();

  const { field: fieldProps } = useController({ control, name: field });

  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingExample, setPendingExample] = useState<ExampleScript | null>(null);

  const handleConfirmLoadExample = () => {
    if (pendingExample) {
      fieldProps.onChange(pendingExample.script);
      trackExampleScriptSelected({ script: pendingExample.script });
    }
    setPendingExample(null);
  };

  return (
    <Column
      grow
      className={cx(
        css`
          & > div[data-fs-element='Code editor'] {
            flex: 1 1 0;
            overflow: visible;
          }
          & > div > div {
            min-height: unset; // code editor
          }
        `
      )}
    >
      <div className={styles.label}>
        <div className={styles.titleRow}>
          <Text variant="bodySmall" weight="medium">
            Script
          </Text>
        </div>
        <div className={styles.descriptionRow}>
          {description && (
            <Text variant="bodySmall" color="secondary">
              {description}
            </Text>
          )}
        </div>
      </div>
      {!isExpanded && (
        <CodeEditor
          {...(fieldProps as any)}
          readOnly={disabled}
          data-form-name={field}
          data-form-element-selector="textarea"
          k6Channel={k6ChannelId}
          renderHeader={() => (
            <>
              <ScriptEditorToolbar
                examples={examples}
                onRequestLoadExample={setPendingExample}
                onExpand={() => setIsExpanded(true)}
              />
              {isDeprecatedChannel && (
                <div className={styles.deprecatedBanner}>
                  <Icon name="exclamation-triangle" size="sm" />
                  <Text variant="bodySmall">This k6 version is no longer supported. Switch to a supported channel.</Text>
                </div>
              )}
            </>
          )}
        />
      )}
      {fieldErrorProps.error && (
        <div
          className={css`
            // less visible layout shift ("extends" code editor)
            background-color: ${theme.colors.background.canvas};
            padding: ${theme.spacing(0, 1, 1)};
          `}
        >
          <FieldValidationMessage>{fieldErrorProps.error}</FieldValidationMessage>
        </div>
      )}

      <ConfirmModal
        isOpen={!!pendingExample}
        title="Load example script?"
        body="This replaces your current script. This can't be undone."
        confirmText="Load example"
        onConfirm={handleConfirmLoadExample}
        onDismiss={() => setPendingExample(null)}
      />

      {isExpanded && (
        <Modal isOpen title="Script" onDismiss={() => setIsExpanded(false)} className={styles.expandedModal}>
          <CodeEditor
            {...(fieldProps as any)}
            readOnly={disabled}
            data-form-name={field}
            data-form-element-selector="textarea"
            k6Channel={k6ChannelId}
          />
        </Modal>
      )}
    </Column>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    label: css`
      margin-bottom: ${theme.spacing(0.5)};
    `,
    titleRow: css`
      margin-bottom: 0;
    `,
    descriptionRow: css`
      display: flex;
      align-items: baseline;
      gap: ${theme.spacing(2)};
    `,
    expandedModal: css`
      width: 90vw;
      max-width: 1400px;
    `,
    deprecatedBanner: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(0.5, 2)};
      background-color: ${theme.colors.warning.main};
      color: ${theme.colors.warning.contrastText};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border-bottom: 1px solid ${theme.colors.border.weak};
    `,
  };
}
