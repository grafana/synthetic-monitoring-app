import React, { BaseSyntheticEvent, useMemo, useRef, useState } from 'react';
import { FieldErrors, FormProvider, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Alert, Button, ConfirmModal, LinkButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckFormValues, CheckPageParams, CheckType, ROUTES } from 'types';
import { hasRole, isOverCheckLimit, isOverScriptedLimit } from 'utils';
import { useChecks, useCUDChecks } from 'data/useChecks';
import { useTenantLimits } from 'data/useTenantLimits';
import { useNavigation } from 'hooks/useNavigation';
import { toFormValues, toPayload } from 'components/CheckEditor/checkFormTransformations';
import { PROBES_SELECT_ID } from 'components/CheckEditor/CheckProbes';
import { CheckTestResultsModal } from 'components/CheckTestResultsModal';
import { CHECK_FORM_ERROR_EVENT, fallbackCheckMap } from 'components/constants';
import { ErrorAlert } from 'components/ErrorAlert';
import { PluginPage } from 'components/PluginPage';
import { getRoute } from 'components/Routing';

import { CheckDNSLayout } from './FormLayouts/CheckDNSLayout';
import { CheckHTTPLayout } from './FormLayouts/CheckHttpLayout';
import { CheckMultiHTTPLayout } from './FormLayouts/CheckMultiHttpLayout';
import { CheckPingLayout } from './FormLayouts/CheckPingLayout';
import { CheckScriptedLayout } from './FormLayouts/CheckScriptedLayout';
import { CheckTCPLayout } from './FormLayouts/CheckTCPLayout';
import { CheckTracerouteLayout } from './FormLayouts/CheckTracerouteLayout';
import { useAdhocTest } from './useTestCheck';

export const CheckForm = () => {
  const { data: checks } = useChecks();
  const { data: limits } = useTenantLimits();
  const { id, checkType: checkTypeParam } = useParams<CheckPageParams>();
  const checkType = isValidCheckType(checkTypeParam) ? checkTypeParam : CheckType.PING;

  if (id && !checks) {
    return null;
  }

  const check = checks?.find((c) => c.id === Number(id)) ?? fallbackCheckMap[checkType];

  // We don't want to gate submission for editing pre-existing checks, just prevent creating new ones
  const overCheckLimit = !check.id && isOverCheckLimit({ checks, limits });
  const overScriptedLimit = !check.id && isOverScriptedLimit({ checks, limits });

  return (
    <CheckFormContent
      check={check}
      checkType={checkType}
      overCheckLimit={Boolean(overCheckLimit)}
      overScriptedLimit={overScriptedLimit}
    />
  );
};

type CheckFormContentProps = {
  check: Check;
  checkType: CheckType;
  overCheckLimit: boolean;
  overScriptedLimit: boolean;
};

const CheckFormContent = ({ check, checkType, overCheckLimit, overScriptedLimit }: CheckFormContentProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const styles = useStyles2(getStyles);
  const { adhocTestData, closeModal, isPending, openTestCheckModal, testCheck, testCheckError } =
    useAdhocTest(checkType);

  const initialValues = useMemo(() => toFormValues(check, checkType), [check, checkType]);
  const formMethods = useForm<CheckFormValues>({
    defaultValues: initialValues,
    shouldFocusError: false, // we manage focus manually
    mode: `onBlur`,
  });

  const { updateCheck, createCheck, deleteCheck, error, submitting } = useCUDChecks({ eventInfo: { checkType } });

  const isEditor = hasRole(OrgRole.Editor);
  const navigate = useNavigation();
  const navigateBack = () => navigate(ROUTES.Checks);
  const onSuccess = () => navigateBack();
  const testRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (checkValues: CheckFormValues, event: BaseSyntheticEvent | undefined) => {
    // react-hook-form doesn't let us provide SubmitEvent to BaseSyntheticEvent
    const submitter = (event?.nativeEvent as SubmitEvent).submitter;
    const toSubmit = toPayload(checkValues);

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
    const shouldFocus = findFieldToFocus(errs);

    // can't pass refs to all fields so have to manage it automatically
    if (shouldFocus) {
      shouldFocus.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      shouldFocus.focus?.({ preventScroll: true });
    }

    document.dispatchEvent(new CustomEvent(CHECK_FORM_ERROR_EVENT, { detail: errs }));
  };

  const handleDelete = () => {
    deleteCheck(check, { onSuccess });
  };

  const actions = useMemo(() => {
    const actions = [
      <LinkButton
        key="cancel"
        href={getRoute(ROUTES.Checks)}
        fill="text"
        variant="secondary"
        data-fs-element="Cancel check button"
      >
        Cancel
      </LinkButton>,
    ];
    if (![CheckType.Traceroute].includes(checkType)) {
      actions.push(
        <Button
          disabled={isPending}
          type="submit"
          key="test"
          data-fs-element="Test check button"
          variant="secondary"
          icon={isPending ? `fa fa-spinner` : undefined}
          ref={testRef}
        >
          Test
        </Button>
      );
    }
    if (check.id) {
      actions.push(
        <Button
          variant="destructive"
          key="delete"
          data-fs-element="Delete check button"
          onClick={() => setShowDeleteModal(true)}
          disabled={!isEditor}
          type="button"
        >
          Delete Check
        </Button>
      );
    }
    actions.push(
      <Button
        type="submit"
        key="save"
        disabled={overScriptedLimit || overCheckLimit || formMethods.formState.isSubmitting || submitting}
        data-fs-element="Save check button"
      >
        Save
      </Button>
    );

    return actions;
  }, [
    overScriptedLimit,
    overCheckLimit,
    formMethods.formState.isSubmitting,
    submitting,
    checkType,
    check.id,
    isPending,
    isEditor,
  ]);

  const capitalizedCheckType = checkType.slice(0, 1).toUpperCase().concat(checkType.split('').slice(1).join(''));
  const headerText = check?.id ? `Editing ${check.job}` : `Add ${capitalizedCheckType} check`;
  const submissionError = error || testCheckError;

  return (
    <PluginPage pageNav={{ text: check?.job ? `Editing ${check.job}` : headerText }}>
      <>
        <FormProvider {...formMethods}>
          <form onSubmit={formMethods.handleSubmit(handleSubmit, handleError)} className={css({ height: '100%' })}>
            {(overCheckLimit || overScriptedLimit) && (
              <ErrorAlert
                title={`Maximum number of ${overScriptedLimit ? 'scripted' : ''} checks reached`}
                content={`You have reached the maximum quantity of ${
                  overScriptedLimit ? 'scripted' : ''
                } checks allowed for your account. Please contact support for assistance.`}
                onClick={navigateBack}
                buttonText="Go to checks"
              />
            )}
            <CheckSelector checkType={checkType} formActions={actions} />
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

const CheckSelector = ({ checkType, formActions }: { checkType: CheckType; formActions: React.JSX.Element[] }) => {
  if (checkType === CheckType.HTTP) {
    return <CheckHTTPLayout formActions={formActions} />;
  }

  if (checkType === CheckType.MULTI_HTTP) {
    return <CheckMultiHTTPLayout formActions={formActions} />;
  }

  if (checkType === CheckType.Scripted) {
    return <CheckScriptedLayout formActions={formActions} />;
  }

  if (checkType === CheckType.PING) {
    return <CheckPingLayout formActions={formActions} />;
  }

  if (checkType === CheckType.DNS) {
    return <CheckDNSLayout formActions={formActions} />;
  }

  if (checkType === CheckType.TCP) {
    return <CheckTCPLayout formActions={formActions} />;
  }

  if (checkType === CheckType.Traceroute) {
    return <CheckTracerouteLayout formActions={formActions} />;
  }

  throw new Error(`Invalid check type: ${checkType}`);
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

function findFieldToFocus(errs: FieldErrors<CheckFormValues>): HTMLElement | undefined {
  if (shouldFocusProbes(errs)) {
    return document.querySelector<HTMLInputElement>(`#${PROBES_SELECT_ID} input`) || undefined;
  }

  const ref = findRef(errs);
  const isVisible = ref?.offsetParent !== null;
  return isVisible ? ref : undefined;
}

function findRef(target: any): HTMLElement | undefined {
  if (Array.isArray(target)) {
    let ref;
    for (let i = 0; i < target.length; i++) {
      const found = findRef(target[i]);

      if (found) {
        ref = found;
        break;
      }
    }

    return ref;
  }

  if (target !== null && typeof target === `object`) {
    if (target.ref) {
      return target.ref;
    }

    return findRef(Object.values(target));
  }

  return undefined;
}

function shouldFocusProbes(errs: FieldErrors<CheckFormValues>) {
  if (errs?.job || errs?.target) {
    return false;
  }

  return `probes` in errs;
}

const getStyles = (theme: GrafanaTheme2) => ({
  stack: css({
    marginTop: theme.spacing(4),
    display: `flex`,
    gap: theme.spacing(1),
  }),
  submissionError: css({
    marginTop: theme.spacing(2),
  }),
});
