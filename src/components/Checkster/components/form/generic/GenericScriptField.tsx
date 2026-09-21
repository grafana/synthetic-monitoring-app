import React, { useState } from 'react';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { SecretReferenceModal, SecretScannerPanel } from '@grafana/plugin-ui/secret-scanner';
import { Box, ConfirmModal, FieldValidationMessage, Icon, Modal, Text, useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackExampleScriptSelected } from 'features/tracking/checkFormEvents';

import { CheckFormFieldPath } from '../../../types';
import { CheckFormValues, K6Channel } from 'types';
import { CodeEditor } from 'components/CodeEditor';
import { SECRETS_EDIT_MODE_ADD } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/constants';
import { SecretEditModal } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/SecretEditModal';

import { ExampleScript } from '../../../../ScriptExamplesMenu/constants';
import { getFieldErrorProps } from '../../../utils/form';
import { Column } from '../../ui/Column';
import { useScriptSecretScanner } from './GenericScriptField.hooks';
import { ScriptEditorToolbar } from './ScriptEditorToolbar';

interface GenericScriptFieldProps {
  field: CheckFormFieldPath;
  examples?: ExampleScript[];
  description?: string;
}

export function GenericScriptField({ field, examples, description }: GenericScriptFieldProps) {
  const {
    control,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();

  const fieldErrorProps = getFieldErrorProps(errors, field);

  const theme = useTheme2();
  const styles = useStyles2(getStyles);

  const k6Channel = useWatch({ control, name: 'channels.k6' }) as K6Channel | undefined;
  const k6ChannelId = k6Channel?.id;
  const isDeprecatedChannel = !!k6Channel && new Date(k6Channel.deprecatedAfter) < new Date();

  const { field: fieldProps } = useController({ control, name: field });
  const script = typeof fieldProps.value === 'string' ? fieldProps.value : '';

  const { scanner, secretsEnabled, existingSecretNames, activeFinding, secretInitialValues, onEditorMount } =
    useScriptSecretScanner({
      field,
      script,
      onChange: fieldProps.onChange,
      disabled,
    });

  const showScannerPanel = secretsEnabled && scanner.findings.length > 0;

  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingExample, setPendingExample] = useState<ExampleScript | null>(null);

  const handleConfirmLoadExample = () => {
    if (pendingExample) {
      fieldProps.onChange(pendingExample.script);
      trackExampleScriptSelected({ script: pendingExample.script });
    }
    setPendingExample(null);
  };

  const renderScriptEditorHeader = () => (
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
  );

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
      {showScannerPanel && (
        <Box padding={2} paddingBottom={0}>
          <SecretScannerPanel scanner={scanner} readOnly={disabled} />
        </Box>
      )}
      {activeFinding && (
        <SecretEditModal
          key={activeFinding.id}
          open
          name={SECRETS_EDIT_MODE_ADD}
          source="check_editor_feature_secret_scanner"
          existingNames={existingSecretNames}
          initialValues={secretInitialValues}
          onCreated={(secret) => scanner.migration.apply(activeFinding, secret.name)}
          onDismiss={scanner.migration.cancel}
        />
      )}
      {/* Shown when a created secret couldn't be inserted automatically (an
          embedded value): lets the user copy the `secrets.get(...)` reference. */}
      <SecretReferenceModal reference={scanner.reference.pending} onDismiss={scanner.reference.dismiss} />
      {!isExpanded && (
        <CodeEditor
          {...(fieldProps as any)}
          readOnly={disabled}
          data-form-name={field}
          data-form-element-selector="textarea"
          k6Channel={k6ChannelId}
          onEditorDidMount={onEditorMount}
          renderHeader={renderScriptEditorHeader}
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
        body="This overwrites your current script and can't be undone."
        confirmText="Load example and overwrite script"
        onConfirm={handleConfirmLoadExample}
        onDismiss={() => setPendingExample(null)}
      />

      {isExpanded && (
        <Modal
          isOpen
          title="Script"
          onDismiss={() => setIsExpanded(false)}
          className={styles.expandedModal}
          contentClassName={styles.expandedModalContent}
        >
          <CodeEditor
            {...(fieldProps as any)}
            readOnly={disabled}
            data-form-name={field}
            data-form-element-selector="textarea"
            k6Channel={k6ChannelId}
            onEditorDidMount={onEditorMount}
            renderHeader={renderScriptEditorHeader}
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
    expandedModalContent: css`
      padding-top: ${theme.spacing(1)};
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
