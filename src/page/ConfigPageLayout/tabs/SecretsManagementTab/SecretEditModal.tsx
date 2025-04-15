import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Field, IconButton, Input, Modal, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { zodResolver } from '@hookform/resolvers/zod';

import { Secret } from './types';
import { useSaveSecret, useSecret } from 'data/useSecrets';

import { SECRETS_EDIT_MODE_ADD } from './constants';
import { SecretInput } from './SecretInput';
import { secretSchema } from './secretSchema';
import { SecretFormValues, secretToFormValues } from './SecretsManagementTab.utils';

interface SecretEditModalProps {
  id: string;
  onDismiss: () => void;
  open?: boolean;
}

function getDefaultValues(): SecretFormValues & { plaintext?: string } {
  return {
    uuid: '',
    name: '',
    description: '',
    labels: [],
    plaintext: undefined,
  };
}

function getFieldErrors(field: keyof Secret, errors: Record<string, { message?: string }>) {
  return { invalid: Boolean(errors[field]), error: errors[field]?.message };
}

function createGetFieldError(errors: Record<string, { message?: string }>) {
  return (field: keyof Secret) => {
    return getFieldErrors(field, errors);
  };
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

export function SecretEditModal({ open, id, onDismiss }: SecretEditModalProps) {
  const { data: secret, isLoading, isError: hasFetchError, error: fetchError } = useSecret(id);
  const saveSecret = useSaveSecret();
  const [isConfigured, setIsConfigured] = useState(id !== '' && id !== SECRETS_EDIT_MODE_ADD);
  const [saveError, setSaveError] = useState<unknown>(null);

  const hasError = hasFetchError || !!saveError;

  const styles = useStyles2(getStyles);
  const defaultValues = useMemo(() => {
    return secretToFormValues(secret) ?? getDefaultValues();
  }, [secret]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SecretFormValues & { plaintext?: string }>({
    defaultValues,
    disabled: isLoading || saveSecret.isPending,
    resolver: zodResolver(secretSchema),
  });

  const fieldError = createGetFieldError(errors);

  const { fields, append, remove } = useFieldArray<SecretFormValues & { plaintext?: string }>({
    control,
    name: 'labels',
  });

  const handleResetValue = () => {
    setIsConfigured(false);
  };

  useEffect(() => {
    // Reset default values for when editing a secret (after secret has been fetched)
    reset(defaultValues);
  }, [reset, defaultValues]);

  const onSubmit = (data: SecretFormValues) => {
    if ('plaintext' in data && data.plaintext === undefined) {
      delete data.plaintext;
    }

    saveSecret.mutate(data, {
      onError(error: unknown) {
        setSaveError(error);
      },
      onSuccess() {
        setSaveError(null);
        onDismiss();
      },
    });
  };

  const title = id === SECRETS_EDIT_MODE_ADD ? 'Create secret' : 'Edit secret';

  if (open !== true) {
    return null;
  }

  return (
    <Modal
      isOpen
      onDismiss={onDismiss}
      title={title}
      onClickBackdrop={() => {
        /* Clicking backdrop will not close modal */
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        {hasError && (
          <Alert title={`Unable to ${hasFetchError ? 'fetch' : 'save'} secret`} severity="error">
            An error occurred while trying to {hasFetchError ? <>fetch secret (id: {id})</> : <>save secret</>}. If the
            problem persists, seek help from an admin or{' '}
            <TextLink href="https://grafana.com/contact" external>
              contact support
            </TextLink>
            .<br />
            <br />
            <strong>Message</strong>
            <br />
            {getErrorMessage(hasFetchError ? fetchError : saveError)}
          </Alert>
        )}
        <input type="hidden" {...register('uuid')} />
        <Field
          htmlFor="secret-name"
          label="Name"
          description="The name will be used to reference the secret"
          required
          {...fieldError('name')}
        >
          <Input id="secret-name" {...register('name', { disabled: isConfigured })} />
        </Field>
        <Field
          htmlFor="secret-description"
          label="Description"
          description="Short description of the purpose of this secret"
          required
          error={errors.description?.message}
          invalid={Boolean(errors.description?.message)}
        >
          <Input id="secret-description" {...register('description')} />
        </Field>
        <Field
          htmlFor="secret-value"
          label="Value"
          description="Value returned when referencing this secret"
          {...fieldError('plaintext')}
          required
        >
          <Controller
            control={control}
            name="plaintext"
            render={({ field }) => (
              <SecretInput
                id="secret-value"
                {...field}
                autoComplete="off"
                onReset={handleResetValue}
                isConfigured={isConfigured}
              />
            )}
          />
        </Field>
        <Field
          label="Labels"
          description="Allows you to specify a set of additional labels to be attached to the secret"
        >
          <div>
            {fields.map((field, index) => {
              return (
                <div key={field.id} className={styles.labelRow}>
                  <Field htmlFor={`secret-labels.${index}.name`} className={styles.labelField}>
                    <Input
                      id={`secret-labels.${index}.name`}
                      placeholder="name"
                      {...register(`labels.${index}.name` as const)}
                    />
                  </Field>
                  <Field htmlFor={`secret-labels.${index}.value`} className={styles.labelField}>
                    <Input
                      id={`secret-labels.${index}.value`}
                      placeholder="value"
                      {...register(`labels.${index}.value` as const)}
                    />
                  </Field>
                  <IconButton aria-label="Remove label" name="minus-circle" onClick={() => remove(index)} />
                </div>
              );
            })}
          </div>
        </Field>

        <div>
          <Button
            size="sm"
            onClick={() => {
              append({ name: '', value: '' });
            }}
            icon="plus"
            variant="secondary"
          >
            Add label
          </Button>
        </div>

        <div className={styles.buttons}>
          <Button
            disabled={isLoading || saveSecret.isPending}
            icon={saveSecret.isPending ? 'fa fa-spinner' : undefined}
            type="submit"
          >
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    labelRow: css`
      display: flex;
      gap: ${theme.spacing(1)};
      align-items: flex-start;
      & > button {
        margin-top: ${theme.spacing(1)};
      }
    `,
    buttons: css`
      display: flex;
      justify-content: flex-end;
      margin-top: ${theme.spacing(1)};
      gap: ${theme.spacing(1)};
    `,
    labelField: css`
      margin-bottom: ${theme.spacing(1)}; // same as labelRow gap
    `,
  };
}
