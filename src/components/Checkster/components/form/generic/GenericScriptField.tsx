import React from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { SecretReferenceModal, SecretScannerPanel } from '@grafana/plugin-ui/secret-scanner';
import { Box, FieldValidationMessage, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormFieldPath } from '../../../types';
import { CheckFormValues, K6Channel } from 'types';
import { CodeEditor } from 'components/CodeEditor';
import { SECRETS_EDIT_MODE_ADD } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/constants';
import { SecretEditModal } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/SecretEditModal';

import { getFieldErrorProps } from '../../../utils/form';
import { Column } from '../../ui/Column';
import { useScriptSecretScanner } from './GenericScriptField.hooks';

interface GenericScriptFieldProps {
  field: CheckFormFieldPath;
}

// FIXME: Not actually a Field (no label, no description), but it has errors!
export function GenericScriptField({ field }: GenericScriptFieldProps) {
  const {
    control,
    getValues,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();

  const fieldErrorProps = getFieldErrorProps(errors, field);

  const theme = useTheme2();

  const k6ChannelId = (getValues('channels.k6') as K6Channel | undefined)?.id;

  const { field: fieldProps } = useController({ control, name: field });
  const script = typeof fieldProps.value === 'string' ? fieldProps.value : '';

  const { scanner, secretsEnabled, existingSecretNames, activeFinding, secretInitialValues, onEditorMount } =
    useScriptSecretScanner({
      field,
      script,
      onChange: fieldProps.onChange,
      disabled,
    });

  return (
    <Column grow>
      <Box padding={2} paddingBottom={0}>
        <SecretScannerPanel scanner={scanner} readOnly={disabled} hidden={!secretsEnabled} />
      </Box>
      {activeFinding && (
        <SecretEditModal
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
      <div
        className={css`
          flex: 1 1 0;
          overflow: visible;
          & > div {
            min-height: unset; // code editor
          }
        `}
      >
        <CodeEditor
          {...(fieldProps as any)}
          readOnly={disabled}
          data-form-name={field}
          data-form-element-selector="textarea"
          k6Channel={k6ChannelId}
          onEditorDidMount={onEditorMount}
        />
      </div>
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
    </Column>
  );
}
