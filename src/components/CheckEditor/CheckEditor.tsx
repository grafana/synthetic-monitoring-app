import React, { FC, useState } from 'react';
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
import { Check, CheckType, OrgRole } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { hasRole, getDefaultValuesFromCheck } from 'utils';
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
  const [error, setError] = useState();

  const defaultValues = getDefaultValuesFromCheck(check);

  const formMethods = useForm({ defaultValues });

  let isEditor = hasRole(OrgRole.EDITOR);

  const onSubmit = async (values: any) => {
    console.log(values);
    return;
    try {
      if (values.id) {
        await instance.updateCheck(values);
      } else {
        await instance.addCheck(values);
      }
      onReturn(true);
    } catch (e) {
      // this.setState({
      //   error: {
      //     status: e.status,
      //     message: e.data?.message ?? 'Something went wrong',
      //   },
      // });
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
          <CheckSettings
            labels={check.labels}
            settings={check.settings}
            typeOfCheck={selectedCheckType}
            isEditor={isEditor}
          />
        </div>
        <HorizontalGroup>
          <Button type="submit">Save {Validation.validateCheck(check)}</Button>
          {check.id && (
            <Button variant="destructive" onClick={() => setShowDeleteModal(true)} disabled={!isEditor}>
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
