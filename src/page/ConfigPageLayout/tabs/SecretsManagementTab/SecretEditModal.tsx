import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Field, IconButton, Input, Modal, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useSaveSecret, useSecret } from 'data/useSecrets';

import { SECRETS_EDIT_MODE_ADD } from './constants';
import { SecretInput } from './SecretInput';
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

export function SecretEditModal({ open, id, onDismiss }: SecretEditModalProps) {
  const { data: secret, isLoading } = useSecret(id);
  const saveSecret = useSaveSecret();
  const [isConfigured, setIsConfigured] = useState(id !== '' && id !== SECRETS_EDIT_MODE_ADD);

  const styles = useStyles2(getStyles);
  const defaultValues = useMemo(() => {
    return secretToFormValues(secret) ?? getDefaultValues();
  }, [secret]);

  const { register, handleSubmit, control, reset } = useForm<SecretFormValues & { plaintext?: string }>({
    defaultValues,
    disabled: isLoading || saveSecret.isPending,
  });

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

    try {
      saveSecret.mutate(data, {
        onSettled() {
          onDismiss();
        },
      });
    } catch (error) {
      onDismiss();
    }
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
        <input type="hidden" {...register('uuid')} />
        <Field htmlFor="secret-name" label="Name" description="The name will be used to reference the secret" required>
          <Input id="secret-name" {...register('name', { disabled: isConfigured })} />
        </Field>
        <Field
          htmlFor="secret-description"
          label="Description"
          description="Short description of the purpose of this secret"
          required
        >
          <Input id="secret-description" {...register('description')} />
        </Field>
        <Field htmlFor="secret-value" label="Value" description="Value returned when referencing this secret" required>
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
          <Button icon={saveSecret.isPending ? 'fa fa-spinner' : undefined} type="submit">
            Save
          </Button>
        </div>
      </form>
      {(isLoading || saveSecret.isPending) && <div>Loading...</div>}
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
