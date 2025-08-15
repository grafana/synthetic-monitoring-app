import React, { BaseSyntheticEvent, ReactNode, useCallback, useEffect } from 'react';
import { FieldErrors, FieldValues, SubmitHandler, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, Stack, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackNavigateWizardForm } from 'features/tracking/checkFormEvents';
import { ZodType } from 'zod';

import { CheckType } from 'types';
import { FORM_MAX_WIDTH, FORM_SECTION_STEPS, SectionName } from 'components/CheckForm/FormLayout/FormLayout.constants';

import { DataTestIds } from '../../../test/dataTestIds';
import { useFormLayoutInternal } from './formlayout.utils';
import { FormNavigation } from './FormNavigation';
import { FormSection } from './FormSection';
import { FormSubmitButton } from './FormSubmitButton';

type ActionNode = {
  index: number;
  element: ReactNode;
};

export type FormLayoutProps<T extends FieldValues> = {
  actions?: ActionNode[];
  alerts?: ReactNode;
  children: ReactNode;
  checkState: 'new' | 'existing';
  checkType: CheckType;
  initialSection?: SectionName;
  onSubmit: (
    onValid: SubmitHandler<T>,
    onInvalid: (errs: FieldErrors<T>) => void
  ) => (event: BaseSyntheticEvent) => void;
  onValid: SubmitHandler<T>;
  onInvalid?: (errs: FieldErrors<T>) => void;
  schema: ZodType;
  hasUnsavedChanges?: boolean;
  onSectionClick: (index: number) => void;
};

export const FormLayout = <T extends FieldValues>({
  actions,
  alerts,
  checkState,
  checkType,
  children,
  onSubmit,
  onValid,
  onInvalid,
  schema,
  onSectionClick,
  hasUnsavedChanges = true, // default to true to prevent accidentally disabling the submit button
}: FormLayoutProps<T>) => {
  const styles = useStyles2(getStyles);
  const {
    formState: { disabled },
  } = useFormContext();
  const {
    formId,
    activeSection,
    goToSection,
    setVisited,
    visitedSections,
    stepOrder,
    setActiveSectionByError,
    getSectionLabel,
    setSubmitDisabled,
    isFirstSection,
    isLastSection,
  } = useFormLayoutInternal();

  const handleVisited = useCallback(
    (indices: number[]) => {
      setVisited(indices);
    },
    [setVisited]
  );

  const handleValid = useCallback(
    (formValues: T, event: BaseSyntheticEvent | undefined) => {
      handleVisited(Object.keys(stepOrder).map((indexKey) => Number(indexKey)));
      onValid(formValues, event);
    },
    [handleVisited, onValid, stepOrder]
  );

  const handleInvalid = useCallback(
    (errs: FieldErrors<T>) => {
      setActiveSectionByError(errs);
      onInvalid?.(errs);
    },
    [setActiveSectionByError, onInvalid]
  );

  const actionButtons = actions?.find((action) => action.index === activeSection)?.element;

  const disableSubmit = !hasUnsavedChanges || disabled;

  useEffect(() => {
    setSubmitDisabled(disableSubmit);
  }, [disableSubmit, setSubmitDisabled]);

  const handleSectionClick = useCallback(
    (index: number) => {
      onSectionClick(index);
    },
    [onSectionClick]
  );

  return (
    <div className={styles.wrapper}>
      {alerts && <div className={styles.alerts}>{alerts}</div>}
      <form id={formId} className={styles.form} onSubmit={onSubmit(handleValid, handleInvalid)}>
        <div className={styles.container}>
          <div className={styles.containerInner}>
            <FormNavigation
              activeSection={activeSection}
              checkState={checkState}
              checkType={checkType}
              onSectionClick={(index: number) => {
                handleSectionClick(index);
                goToSection(index);
              }}
              visitedSections={visitedSections}
              schema={schema}
            />
          </div>

          <div className={styles.divider} />

          <div className={cx(styles.containerInner, styles.containerInnerOverflow)}>
            <div className={styles.formContent}>{children}</div>
          </div>

          <div className={styles.divider} />

          <div data-testid={DataTestIds.ACTIONS_BAR} className={styles.containerInner}>
            <Stack justifyContent="space-between">
              {!isFirstSection ? (
                <Button
                  onClick={() => {
                    const prevStep = activeSection - 1;
                    trackNavigateWizardForm({
                      checkState,
                      checkType,
                      component: 'back-button',
                      step: FORM_SECTION_STEPS[prevStep],
                    });
                    goToSection(prevStep);
                  }}
                  icon="arrow-left"
                  variant="secondary"
                >
                  <Stack gap={0.5}>
                    <div>{getSectionLabel(activeSection - 1)}</div>
                  </Stack>
                </Button>
              ) : (
                <div />
              )}
              <Stack>
                {actionButtons}
                {!isLastSection ? (
                  <Button
                    onClick={() => {
                      const newStep = activeSection + 1;
                      trackNavigateWizardForm({
                        checkState,
                        checkType,
                        component: 'forward-button',
                        step: FORM_SECTION_STEPS[newStep],
                      });
                      goToSection(newStep);
                    }}
                    type="button"
                  >
                    <Stack alignItems="center">
                      <div>{getSectionLabel(activeSection + 1)}</div>
                      <Icon size="lg" name="arrow-right" />
                    </Stack>
                  </Button>
                ) : (
                  <FormSubmitButton />
                )}
              </Stack>
            </Stack>
          </div>
        </div>
      </form>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = `formLayout`;
  // const breakpoint = theme.breakpoints.values.md;
  // const query = `(min-width: ${breakpoint + 1}px)`;
  // const containerQuery = `@container ${containerName} ${query}`;
  //
  // const containerRules = {
  //   height: '100%',
  // };

  return {
    wrapper: css`
      container-name: ${containerName};
      container-type: inline-size;
      height: 100%;
      display: flex;
      contain: layout;
      flex-direction: column;
      position: relative;
      overflow: auto;
    `,
    container: css`
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      border: 1px solid ${theme.colors.border.medium};
      position: relative;
      height: 100%;
    `,
    divider: css`
      height: 1px;
      border-bottom: 1px solid ${theme.colors.border.medium};
      flex: 0 0 1px;
    `,
    containerInner: css({
      position: 'relative',
      padding: theme.spacing(2),
    }),
    form: css({
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
    }),
    alerts: css({
      marginTop: theme.spacing(2),
    }),
    containerInnerOverflow: css`
      overflow: auto;
      flex: 1 1 0;
    `,
    formContent: css`
      width: 100%;
      max-width: ${FORM_MAX_WIDTH};
      justify-self: center;
    `,
  };
};

FormLayout.Section = FormSection;
