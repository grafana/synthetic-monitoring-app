import React, { FC, useState, useMemo } from 'react';
import { css } from 'emotion';
import {
  Button,
  Container,
  ConfirmModal,
  Field,
  Input,
  HorizontalGroup,
  Switch,
  Select,
  Legend,
  Alert,
} from '@grafana/ui';
import { Check, CheckType, OrgRole, CheckFormValues } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { hasRole } from 'utils';
import { getDefaultValuesFromCheck, getCheckFromFormValues } from './checkFormTransformations';
import * as Validation from 'validation';
import CheckTarget from 'components/CheckTarget';
import { Subheader } from 'components/Subheader';
import { CheckSettings } from './CheckSettings';
import { ProbeOptions } from './ProbeOptions';
import { CHECK_TYPE_OPTIONS } from 'components/constants';
import { useForm, FormContext, Controller } from 'react-hook-form';

interface Props {
  check: Check;
  instance: SMDataSource;
  onReturn: (reload: boolean) => void;
}

export const CheckEditor: FC<Props> = ({ check, instance, onReturn }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);

  const formMethods = useForm<CheckFormValues>({ defaultValues });

  let isEditor = hasRole(OrgRole.EDITOR);

  const onSubmit = async (values: CheckFormValues) => {
    console.log(values);
    const updatedCheck = getCheckFromFormValues(values, check);
    console.log(check);
    try {
      if (values.id) {
        await instance.updateCheck(updatedCheck);
      } else {
        await instance.addCheck(updatedCheck);
      }
      onReturn(true);
    } catch (e) {
      setError(e);
    }
  };

  const onRemoveCheck = async () => {
    const id = check.id;
    if (!id) {
      return;
    }
    await instance.deleteCheck(id);
    onReturn(true);
  };

  const onBack = () => onReturn(true);

  const target = formMethods.watch('target', '') as string;
  const selectedCheckType = formMethods.watch('checkType').value as CheckType;

  if (!check) {
    return <div>Loading...</div>;
  }

  return (
    <FormContext {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)}>
        <Legend>{check.id ? 'Add Check' : 'Edit Check'}</Legend>
        <div
          className={css`
            margin-bottom: 8px;
          `}
        >
          <Subheader>Check Details</Subheader>
          <HorizontalGroup justify="flex-start" spacing="md">
            <Field label="Check Type" disabled={check.id ? true : false}>
              <Controller
                name="checkType"
                control={formMethods.control}
                as={Select}
                options={CHECK_TYPE_OPTIONS}
                width={30}
              />
            </Field>
            <Field label="Enabled" disabled={!isEditor}>
              <Container padding="sm">
                <Switch name="enabled" ref={formMethods.register()} disabled={!isEditor} />
              </Container>
            </Field>
          </HorizontalGroup>
          <Field
            label="Job Name"
            description="Name used for job label"
            disabled={!isEditor}
            // invalid={!Validation.validateJob(check.job)}
          >
            <Input ref={formMethods.register()} name="job" type="string" placeholder="jobName" />
          </Field>

          <Controller
            name="target"
            as={CheckTarget}
            control={formMethods.control}
            target={target}
            valueName="target"
            typeOfCheck={selectedCheckType}
            checkSettings={check.settings}
            disabled={!isEditor}
          />
          <hr
            className={css`
              margin-top: 24px;
            `}
          />
          <ProbeOptions isEditor={isEditor} timeout={check.timeout} frequency={check.frequency} probes={check.probes} />
          <CheckSettings typeOfCheck={selectedCheckType} isEditor={isEditor} />
        </div>
        <HorizontalGroup>
          <Button type="submit">Save {Validation.validateCheck(check)}</Button>
          {check.id && (
            <Button variant="destructive" onClick={() => setShowDeleteModal(true)} disabled={!isEditor} type="button">
              Delete Check
            </Button>
          )}
          <ConfirmModal
            isOpen={showDeleteModal}
            title="Delete check"
            body="Are you sure you want to delete this check?"
            confirmText="Delete check"
            onConfirm={onRemoveCheck}
            onDismiss={() => setShowDeleteModal(false)}
          />
          <a onClick={onBack}>Back</a>
        </HorizontalGroup>
        {error && (
          <div
            className={css`
              margin-top: 1rem;
            `}
          >
            <Alert title="Save failed" severity="error">
              {`${error?.status}: ${error?.message}`}
            </Alert>
          </div>
        )}
      </form>
    </FormContext>
  );
};
