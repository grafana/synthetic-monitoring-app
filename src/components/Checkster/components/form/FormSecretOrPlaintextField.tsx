import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Combobox, ComboboxOption, Input, Label, RadioButtonGroup, Text, TextArea, TextLink, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckFormFieldPath } from '../../types';
import { CheckFormValues, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { useUserPermissions } from 'data/permissions';
import { useSecrets } from 'data/useSecrets';
import { useDOMId } from 'hooks/useDOMId';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

import { getFieldErrorProps } from '../../utils/form';
import { buildSecretRef, isSecretRef, parseSecretName } from '../../utils/secrets';
import { PasswordInput } from '../PasswordInput';
import { StyledField } from '../ui/StyledField';

type FieldMode = 'plaintext' | 'secret';

const MODE_OPTIONS: Array<{ label: string; value: FieldMode }> = [
  { label: 'Value', value: 'plaintext' },
  { label: 'Secret', value: 'secret' },
];

export interface FormSecretOrPlaintextFieldProps {
  field: CheckFormFieldPath;
  label?: string;
  description?: string;
  required?: boolean;
  /** Plaintext render mode: masked single-line input, or a multi-line textarea (certs/keys). */
  variant: 'password' | 'textarea';
  rows?: number;
  placeholder?: string;
  /** Whether this field is eligible for secret references at all (HTTP only today). */
  allowSecrets?: boolean;
  /** Forwarded to the underlying field wrapper so the control can grow in a row. */
  grow?: boolean;
}

/**
 * A credential field that can hold either a plaintext value or a reference to a
 * secret (`${secrets.<name>}`). When secrets are available it renders a
 * "Value / Secret" toggle; picking a secret writes the reference into the same
 * form field. The `secretManagerEnabled` flag is not exposed here — it is
 * inferred from field values at serialization time.
 */
/**
 * Whether a credential field can reference a secret: the field opts in via
 * `allowSecrets`, the feature flag is on, and the user can read secrets. Exported
 * so a sibling plain field (e.g. the basic-auth username) can match this field's
 * taller, toggle-carrying label row when the toggle is shown.
 */
export function useSecretsFieldEnabled(allowSecrets?: boolean): boolean {
  const { isEnabled } = useFeatureFlag(FeatureName.SecretsManagement);
  const { canReadSecrets } = useUserPermissions();
  return Boolean(allowSecrets && isEnabled && canReadSecrets);
}

export function FormSecretOrPlaintextField(props: FormSecretOrPlaintextFieldProps) {
  const secretsAvailable = useSecretsFieldEnabled(props.allowSecrets);

  if (!secretsAvailable) {
    return <PlaintextField {...props} />;
  }

  return (
    <QueryErrorBoundary
      title="Error loading secrets"
      content="Failed to load secrets. Please check your connection and try again."
    >
      <SecretOrPlaintextField {...props} />
    </QueryErrorBoundary>
  );
}

/**
 * Plaintext-only render (secrets unavailable). If the field already holds a
 * secret reference (e.g. the check was created elsewhere), show it in a disabled
 * input so the reference is preserved on save rather than silently dropped.
 */
function PlaintextField({ field, label, description, required, variant, rows, placeholder, grow }: FormSecretOrPlaintextFieldProps) {
  const {
    register,
    watch,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();
  const id = useDOMId();
  const holdsSecret = isSecretRef(watch(field) as string | undefined);

  return (
    <StyledField
      grow={grow}
      label={label}
      description={holdsSecret ? 'This field references a secret. Enable secrets management to edit it.' : description}
      required={required}
      htmlFor={id}
      {...getFieldErrorProps(errors, field)}
    >
      {holdsSecret ? (
        <Input id={id} type="text" disabled {...register(field)} />
      ) : variant === 'textarea' ? (
        <TextArea id={id} rows={rows ?? 3} placeholder={placeholder} disabled={disabled} aria-label={label} {...register(field)} />
      ) : (
        <PasswordInput id={id} placeholder={placeholder} disabled={disabled} {...register(field)} />
      )}
    </StyledField>
  );
}

function SecretOrPlaintextField({
  field,
  label,
  description,
  required,
  variant,
  rows,
  placeholder,
  grow,
}: FormSecretOrPlaintextFieldProps) {
  const styles = useStyles2(getStyles);
  const {
    register,
    setValue,
    watch,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();
  const id = useDOMId();
  const value = watch(field) as string | undefined;

  // Seed the mode from the current value, then keep it in sync when the value
  // changes externally (e.g. after the form is reset with new check data, or a
  // ${secrets.*} reference is pasted into the value input): a secret reference
  // must show the secret picker, not a masked input. An empty value keeps the
  // current mode, so switching to "Secret" to pick a secret does not
  // immediately flip back to "Value".
  const [mode, setMode] = useState<FieldMode>(() => (isSecretRef(value) ? 'secret' : 'plaintext'));

  useEffect(() => {
    if (isSecretRef(value)) {
      setMode('secret');
    } else if (value) {
      setMode('plaintext');
    }
  }, [value]);

  const { data: secrets = [], isLoading } = useSecrets(true);

  const handleModeChange = (next: FieldMode) => {
    setMode(next);
    // Only clear a value that belongs to the *other* mode, so we never persist a
    // plaintext token in "Secret" mode (or vice versa). A value that already
    // matches the target mode — e.g. an existing ${secrets.*} reference when
    // switching to "Secret" — is preserved rather than dropped.
    if ((next === 'secret') !== isSecretRef(value)) {
      setValue(field, '', { shouldDirty: true });
    }
  };

  const selectedSecret = parseSecretName(value);
  const options: Array<ComboboxOption<string>> = secrets.map((secret) => ({
    label: secret.name,
    value: secret.name,
    description: secret.description,
  }));
  // Surface a referenced-but-missing secret so its value is not silently lost.
  if (selectedSecret && !options.some((option) => option.value === selectedSecret)) {
    options.push({ label: `${selectedSecret} (not found)`, value: selectedSecret });
  }

  const hasNoSecrets = !isLoading && secrets.length === 0;

  return (
    <div className={cx(styles.wrapper, { [styles.grow]: grow })}>
      <div className={styles.header}>
        <Label htmlFor={id} description={description} className={styles.label}>
          {label}
          {required ? ' *' : ''}
        </Label>
        <RadioButtonGroup<FieldMode>
          size="sm"
          options={MODE_OPTIONS}
          value={mode}
          onChange={handleModeChange}
          disabled={disabled}
        />
      </div>
      <StyledField htmlFor={id} {...getFieldErrorProps(errors, field)}>
        {mode === 'secret' ? (
          <Combobox<string>
            id={id}
            options={options}
            value={selectedSecret ?? null}
            disabled={disabled}
            placeholder={isLoading ? 'Loading secrets...' : 'Select a secret'}
            onChange={(option) => {
              const name = typeof option === 'string' ? option : option?.value;
              if (name) {
                setValue(field, buildSecretRef(name), { shouldDirty: true });
              }
            }}
          />
        ) : variant === 'textarea' ? (
          <TextArea
            id={id}
            rows={rows ?? 3}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={label}
            {...register(field)}
          />
        ) : (
          <PasswordInput id={id} placeholder={placeholder} disabled={disabled} {...register(field)} />
        )}
      </StyledField>

      {mode === 'secret' && hasNoSecrets && (
        <Text variant="bodySmall" color="secondary">
          No secrets available.{' '}
          <TextLink href={`${getRoute(AppRoutes.Config)}/secrets`} variant="bodySmall">
            Create one in Config
          </TextLink>
        </Text>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  grow: css({
    flexGrow: 1,
  }),
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    // The sm RadioButtonGroup is theme.spacing(3) tall; pin the row to it so a
    // sibling plain field can match this height and keep both inputs aligned.
    minHeight: theme.spacing(3),
  }),
  label: css({
    marginBottom: 0,
  }),
});
