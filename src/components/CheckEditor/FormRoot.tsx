import React, { BaseSyntheticEvent, PropsWithChildren, ReactElement, useCallback, useEffect, useMemo } from 'react';
import { FieldErrors, SubmitErrorHandler, SubmitHandler, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';

import { checkHasChanges } from '../CheckForm/CheckForm.utils';
import { ConfirmLeavingPage } from '../ConfirmLeavingPage';
import { useCheckEditorApi } from './CheckEditor.hooks';
import { useCheckEditorContext } from './CheckEditorContext';
import { FormFooter } from './FormFooter';

export function FormRoot<T extends CheckFormValues>({
  children,
  alerts = null,
}: PropsWithChildren<{ alerts?: ReactElement | null }>) {
  const styles = useStyles2(getStyles);

  const {
    handleSubmit,
    getValues,
    formState: { disabled },
  } = useFormContext<T>();

  const {
    checkMeta: { defaultFormValues },
    formId,
    setVisited,
    stepOrder,
    setActiveSectionByError,
    setSubmitDisabled,
  } = useCheckEditorContext();

  const { error, handleInvalid, handleValid, isSubmittingToApi } = useCheckEditorApi();

  // const { formId, setVisited, stepOrder, setActiveSectionByError, setSubmitDisabled } = useFormLayoutInternal();

  const handleVisited = useCallback(
    (indices: number[]) => {
      setVisited(indices);
    },
    [setVisited]
  );

  const handleOnValid = useCallback(
    (formValues: T, event: BaseSyntheticEvent | undefined) => {
      handleVisited(Object.keys(stepOrder).map((indexKey) => Number(indexKey)));
      handleValid(formValues);
    },
    [handleValid, handleVisited, stepOrder]
  );

  const handleOnInvalid = useCallback(
    (errs: FieldErrors<T>) => {
      setActiveSectionByError(errs);
      handleInvalid(errs);
    },
    [handleInvalid, setActiveSectionByError]
  );

  const formValues = getValues();
  // @todo Ideally, we dont submit the form when running ad-hoc check and instead use `isDirty`
  const isFormModified = useMemo(() => {
    return checkHasChanges(defaultFormValues, formValues);
  }, [defaultFormValues, formValues]);

  const hasUnsavedChanges = error ? true : isFormModified && !isSubmittingToApi;
  const hasAlerts = Boolean(alerts);
  const disableSubmit = !hasUnsavedChanges || disabled;

  useEffect(() => {
    setSubmitDisabled(disableSubmit);
  }, [disableSubmit, setSubmitDisabled]);

  const handleOnSubmit = (onValid: SubmitHandler<T>, onInvalid: SubmitErrorHandler<T>) =>
    handleSubmit(onValid, onInvalid);

  return (
    <>
      <form className={styles.form} id={formId} onSubmit={handleOnSubmit(handleOnValid, handleOnInvalid)}>
        {hasAlerts && alerts}
        <div className={styles.sections}>{children}</div>
        <FormFooter />
      </form>
      <ConfirmLeavingPage enabled={hasUnsavedChanges} />
    </>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    form: css`
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
    `,
    sections: css`
      padding: ${theme.spacing(2)};
      position: relative;
      overflow: auto;
      flex: 1 1 0;
    `,
  };
}
