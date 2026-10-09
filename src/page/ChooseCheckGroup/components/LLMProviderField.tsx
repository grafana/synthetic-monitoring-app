import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Combobox, ComboboxOption, Field, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { FeatureName } from 'types';
import { useUserPermissions } from 'data/permissions';
import { useSecrets } from 'data/useSecrets';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';
import { SECRETS_EDIT_MODE_ADD } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/constants';
import { SecretEditModal } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/SecretEditModal';

const FIELD_ID = 'template-llm-secret';

interface LLMProviderFieldProps {
  /** Name of the secret holding the Anthropic API key. */
  value?: string;
  onChange: (secretName: string) => void;
  error?: string;
}

/** Lets the user pick, or create in a popup, the secret that holds their Anthropic API key. */
export function LLMProviderField(props: LLMProviderFieldProps) {
  const { isEnabled } = useFeatureFlag(FeatureName.SecretsManagement);
  const { canReadSecrets, canCreateSecrets } = useUserPermissions();

  return (
    <Field
      label="LLM provider"
      description={
        <>
          This check only supports Anthropic as the LLM provider.
          <br />
          Select the secret that contains your Anthropic API key.
        </>
      }
      htmlFor={FIELD_ID}
      required
      error={props.error}
      invalid={!!props.error}
    >
      {!isEnabled ? (
        <Alert title="Secrets management is not available" severity="warning">
          An Anthropic API key stored as a secret is required to run this check.
        </Alert>
      ) : (
        <QueryErrorBoundary
          title="Error loading secrets"
          content="Failed to load secrets. Please check your connection and try again."
        >
          <SecretPicker {...props} canRead={canReadSecrets} canCreate={canCreateSecrets} />
        </QueryErrorBoundary>
      )}
    </Field>
  );
}

function SecretPicker({
  value,
  onChange,
  canRead,
  canCreate,
}: LLMProviderFieldProps & { canRead: boolean; canCreate: boolean }) {
  const styles = useStyles2(getStyles);
  const [creating, setCreating] = useState(false);
  const { data: secrets = [], isLoading } = useSecrets(canRead);

  const options: Array<ComboboxOption<string>> = secrets.map((secret) => ({
    label: secret.name,
    value: secret.name,
    description: secret.description,
  }));
  const hasSecrets = secrets.length > 0;

  const hasNoSecrets = canRead && !isLoading && !hasSecrets;

  return (
    <Stack direction="column" gap={0.5}>
      {hasNoSecrets ? (
        <Text variant="bodySmall" color="secondary">
          {canCreate ? (
            <>
              You don’t have any secrets yet.{' '}
              <button type="button" className={styles.link} onClick={() => setCreating(true)}>
                Create one
              </button>{' '}
              with your Anthropic API key.
            </>
          ) : (
            'You don’t have any secrets yet. Ask an administrator to create one with your Anthropic API key.'
          )}
        </Text>
      ) : (
        <>
          <Combobox<string>
            id={FIELD_ID}
            options={options}
            value={value ?? null}
            disabled={!canRead}
            placeholder={isLoading ? 'Loading secrets...' : 'Select a secret'}
            onChange={(option) => option?.value && onChange(option.value)}
          />
          {canCreate && !isLoading && (
            <Text variant="bodySmall" color="secondary">
              No secret contains the Anthropic API key?{' '}
              <button type="button" className={styles.link} onClick={() => setCreating(true)}>
                Create a new one
              </button>
            </Text>
          )}
        </>
      )}
      <SecretEditModal
        open={creating}
        name={SECRETS_EDIT_MODE_ADD}
        source="check_template_llm_provider"
        existingNames={secrets.map((secret) => secret.name)}
        initialValues={{ name: 'anthropic-api-key', description: 'Anthropic API key' }}
        onCreated={(secret) => onChange(secret.name)}
        onDismiss={() => setCreating(false)}
      />
    </Stack>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    link: css({
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      color: theme.colors.text.link,
      font: 'inherit',
      '&:hover, &:focus': { textDecoration: 'underline' },
    }),
  };
}
