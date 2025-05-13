import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Field, IconButton, Input, Modal, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { zodResolver } from '@hookform/resolvers/zod';

import { Secret } from './types';
import { useSaveSecret, useSecret } from 'data/useSecrets';

import { SECRETS_EDIT_MODE_ADD, SECRETS_MAX_LABELS } from './constants';
import { SecretInput } from './SecretInput';
import { secretSchemaFactory } from './secretSchema';
import { SecretFormValues, secretToFormValues } from './SecretsManagementTab.utils';

interface SecretEditModalProps {
  id: string;
  onDismiss: () => void;
  open?: boolean;
  existingNames?: string[];
}

function getDefaultValues(isNew = true): SecretFormValues & { plaintext?: string } {
  return {
    uuid: '',
    name: '',
    description: '',
    labels: [],
    plaintext: isNew ? '' : undefined,
  };
}

type FormField = keyof Secret;

interface FieldError {
  message: string;
  type: string;
  ref: React.RefObject<HTMLElement>;
}

type LabelErrors = Array<{
  name: FieldError;
  value: FieldError;
}>;

type FormErrorMap = Record<FormField, FieldError | LabelErrors | undefined>;

function getFieldErrors(field: FormField, errors: FormErrorMap, index?: number, property?: 'name' | 'value') {
  const error = errors[field];

  if (Array.isArray(error) && index !== undefined && index >= 0 && !!property) {
    return { invalid: Boolean(error?.[index]?.[property]), error: error?.[index]?.[property]?.message };
  }

  return { invalid: Boolean(error), error: (error as FieldError)?.message };
}

function createGetFieldError(errors: FormErrorMap) {
  return (field: FormField, index?: number, property?: 'name' | 'value') => {
    return getFieldErrors(field, errors, index, property);
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

export function SecretEditModal({ open, id, onDismiss, existingNames = [] }: SecretEditModalProps) {
  const { data: secret, isLoading, isError: hasFetchError, error: fetchError } = useSecret(id);
  const saveSecret = useSaveSecret();
  const isNewSecret = id === SECRETS_EDIT_MODE_ADD;
  const [isConfigured, setIsConfigured] = useState(id !== '' && !isNewSecret);
  const [saveError, setSaveError] = useState<unknown>(null);
  const hasError = hasFetchError || !!saveError;
  const styles = useStyles2(getStyles);
  const defaultValues = useMemo(() => {
    return secretToFormValues(secret) ?? getDefaultValues(isNewSecret);
  }, [secret, isNewSecret]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    getValues,
    setValue,
    trigger,
  } = useForm<SecretFormValues & { plaintext?: string }>({
    defaultValues,
    disabled: isLoading || saveSecret.isPending,
    resolver: zodResolver(secretSchemaFactory(isNewSecret, existingNames)),
  });

  // Set the default value for plaintext to empty string when secret is reset (for validation to work)
  useEffect(() => {
    setValue('plaintext', isConfigured ? undefined : '');
  }, [setValue, isConfigured]);

  const fieldError = createGetFieldError(errors as FormErrorMap);

  const { fields, append, remove } = useFieldArray<SecretFormValues & { plaintext?: string }>({
    control,
    name: 'labels',
  });

  const handleResetValue = () => {
    setIsConfigured(false);
  };

  useEffect(() => {
    // Reset default values for when editing a secret (after the secret has been fetched)
    reset(defaultValues);
  }, [reset, defaultValues]);

  const onSubmit = (data: SecretFormValues) => {
    if ('plaintext' in data && (data.plaintext === undefined || isConfigured)) {
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

  const title = isNewSecret ? 'Create secret' : 'Edit secret';

  if (open !== true) {
    return null;
  }

  const maxLabelsReached = getValues('labels').length >= SECRETS_MAX_LABELS;

  return (
    <Modal
      data-testid="secret-edit-modal"
      isOpen
      onDismiss={onDismiss}
      title={title}
      onClickBackdrop={() => {
        /* Clicking the backdrop will not close the modal */
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
          <Input
            id="secret-name"
            {...register('name', { disabled: !isNewSecret })}
            onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
              setValue('name', target.value.replaceAll(' ', '-').toLowerCase());
              trigger('name');
            }}
          />
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
              <SecretInput id="secret-value" {...field} onReset={handleResetValue} isConfigured={isConfigured} />
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
                  <Field
                    htmlFor={`secret-labels.${index}.name`}
                    className={styles.labelField}
                    {...fieldError('labels', index, 'name')}
                  >
                    <Input
                      id={`secret-labels.${index}.name`}
                      placeholder="name"
                      {...register(`labels.${index}.name` as const)}
                      onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
                        const fieldName = `labels.${index}.name` as const;
                        setValue(fieldName, target.value.replaceAll(' ', '-'));
                        trigger(fieldName);
                      }}
                    />
                  </Field>
                  <Field
                    htmlFor={`secret-labels.${index}.value`}
                    className={styles.labelField}
                    {...fieldError('labels', index, 'value')}
                  >
                    <Input
                      id={`secret-labels.${index}.value`}
                      placeholder="value"
                      {...register(`labels.${index}.value` as const)}
                      onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
                        const fieldName = `labels.${index}.value` as const;
                        setValue(fieldName, target.value.replaceAll(' ', '-'));
                        trigger(fieldName);
                      }}
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
            disabled={maxLabelsReached}
            tooltip={maxLabelsReached ? `Maximum number of labels reached (Max: ${SECRETS_MAX_LABELS})` : undefined}
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
