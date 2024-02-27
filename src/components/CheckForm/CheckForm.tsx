import React, { BaseSyntheticEvent, useMemo, useRef, useState } from 'react';
import { FieldErrors, FormProvider, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Alert, Button, ConfirmModal, Field, HorizontalGroup, Input, LinkButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckFormValues, CheckPageParams, CheckType, ROUTES } from 'types';
import { isMultiHttpCheck, isScriptedCheck } from 'utils.types';
import { hasRole } from 'utils';
import { validateJob } from 'validation';
import { useChecks, useCUDChecks } from 'data/useChecks';
import { useNavigation } from 'hooks/useNavigation';
import { getCheckFromFormValues, getFormValuesFromCheck } from 'components/CheckEditor/checkFormTransformations';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckTestResultsModal } from 'components/CheckTestResultsModal';
import { fallbackCheckMap } from 'components/constants';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';
import { MultiHttpFeedbackAlert } from 'components/MultiHttp/MultiHttpFeedbackAlert';
import { PluginPage } from 'components/PluginPage';
import { getRoute } from 'components/Routing';

import { MultiHttpSettingsForm } from './MultiHttpCheckForm';
import { ScriptedCheckForm } from './ScriptedCheckForm';
import { SimpleCheckForm } from './SimpleCheckForm';
import { useAdhocTest } from './useTestCheck';

export const CheckForm = () => {
  const { data: checks } = useChecks();
  const { id, checkType: checkTypeParam } = useParams<CheckPageParams>();
  const checkType = isValidCheckType(checkTypeParam) ? checkTypeParam : CheckType.PING;

  if (id && !checks) {
    return null;
  }

  const check = checks?.find((c) => c.id === Number(id)) ?? fallbackCheckMap[checkType];

  return <CheckFormContent check={check} checkType={checkType} />;
};

type CheckFormContentProps = {
  check: Check;
  checkType: CheckType;
};

const CheckFormContent = ({ check, checkType }: CheckFormContentProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const styles = useStyles2(getStyles);
  const { adhocTestData, closeModal, isPending, openTestCheckModal, testCheck, testCheckError } =
    useAdhocTest(checkType);

  const initialValues = useMemo(() => getFormValuesFromCheck(check), [check]);
  const formMethods = useForm<CheckFormValues>({
    defaultValues: initialValues,
    reValidateMode: 'onBlur',
    shouldFocusError: true /* handle this manually */,
  });

  const { updateCheck, createCheck, deleteCheck, error, submitting } = useCUDChecks({ eventInfo: { checkType } });

  const isEditor = hasRole(OrgRole.Editor);
  const navigate = useNavigation();
  const navigateBack = () => navigate(ROUTES.Checks);
  const onSuccess = () => navigateBack();
  const testRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (checkValues: CheckFormValues, event: BaseSyntheticEvent | undefined) => {
    // @ts-expect-error
    const submitter = event?.nativeEvent.submitter;
    const toSubmit = getCheckFromFormValues(checkValues);

    if (submitter === testRef.current) {
      return testCheck(toSubmit);
    }

    mutateCheck(toSubmit);
  };

  const mutateCheck = (newCheck: Check) => {
    if (check.id) {
      return updateCheck(
        {
          id: check.id,
          tenantId: check.tenantId,
          ...newCheck,
        },
        { onSuccess }
      );
    }

    return createCheck(newCheck, { onSuccess });
  };

  const handleError = (errs: FieldErrors<CheckFormValues>) => {
    document.dispatchEvent(new CustomEvent('sm-form-error', { detail: errs }));
  };

  const handleDelete = () => {
    deleteCheck(check, { onSuccess });
  };

  const capitalizedCheckType = checkType.slice(0, 1).toUpperCase().concat(checkType.split('').slice(1).join(''));
  const headerText = check?.id ? `Editing ${check.job}` : `Add ${capitalizedCheckType} check`;
  const submissionError = error || testCheckError;

  return (
    <PluginPage pageNav={{ text: check?.job ? `Editing ${check.job}` : headerText }}>
      {checkType === CheckType.MULTI_HTTP && <MultiHttpFeedbackAlert />}
      <>
        <FormProvider {...formMethods}>
          <form onSubmit={formMethods.handleSubmit(handleSubmit, handleError)}>
            <HorizontalCheckboxField
              disabled={!isEditor}
              id="check-form-enabled"
              label="Enabled"
              description="If a check is enabled, metrics and logs are published to your Grafana Cloud stack."
              {...formMethods.register('enabled')}
            />
            <Field
              label="Job name"
              description={'Name used for job label (in metrics it will appear as `jobName=X`)'}
              disabled={!isEditor}
              invalid={Boolean(formMethods.formState.errors.job)}
              error={formMethods.formState.errors.job?.message}
            >
              <Input
                id="check-editor-job-input"
                {...formMethods.register('job', {
                  required: true,
                  validate: validateJob,
                })}
                type="text"
                placeholder="jobName"
              />
            </Field>
            <FormFields check={check} checkType={checkType} />
            <CheckFormAlert />
            <HorizontalGroup>
              <Button type="submit" disabled={formMethods.formState.isSubmitting || submitting}>
                Save
              </Button>
              {![CheckType.Scripted, CheckType.Traceroute].includes(checkType) && (
                <Button
                  disabled={isPending}
                  type="submit"
                  variant="secondary"
                  icon={isPending ? `fa fa-spinner` : undefined}
                  ref={testRef}
                >
                  Test
                </Button>
              )}
              {check?.id && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={!isEditor}
                  type="button"
                >
                  Delete Check
                </Button>
              )}

              <LinkButton href={getRoute(ROUTES.Checks)} fill="text" variant="secondary">
                Cancel
              </LinkButton>
            </HorizontalGroup>
          </form>
        </FormProvider>
      </>
      {submissionError && (
        <div className={styles.submissionError}>
          <Alert title="Save failed" severity="error">
            {submissionError.message ?? 'Something went wrong'}
          </Alert>
        </div>
      )}
      <CheckTestResultsModal isOpen={openTestCheckModal} onDismiss={closeModal} testResponse={adhocTestData} />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete check"
        body="Are you sure you want to delete this check?"
        confirmText="Delete check"
        onConfirm={handleDelete}
        onDismiss={() => setShowDeleteModal(false)}
      />
    </PluginPage>
  );
};

const FormFields = ({ check, checkType }: { check: Check; checkType: CheckType }) => {
  if (isMultiHttpCheck(check)) {
    return <MultiHttpSettingsForm check={check} />;
  }

  if (isScriptedCheck(check)) {
    return <ScriptedCheckForm check={check} />;
  }

  return <SimpleCheckForm check={check} checkType={checkType} />;
};

function isValidCheckType(checkType?: CheckType): checkType is CheckType {
  if (!checkType) {
    return false;
  }

  if (Object.values(CheckType).includes(checkType)) {
    return true;
  }

  return false;
}

const getStyles = (theme: GrafanaTheme2) => ({
  breakLine: css({
    marginTop: theme.spacing(3),
  }),
  submissionError: css({
    marginTop: theme.spacing(2),
  }),
});
