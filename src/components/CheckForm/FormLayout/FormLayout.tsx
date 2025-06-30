import React, { BaseSyntheticEvent, Children, isValidElement, ReactNode, useCallback, useMemo } from 'react';
import { FieldErrors, FieldValues, SubmitHandler, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Stack, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackNavigateWizardForm } from 'features/tracking/checkFormEvents';
import { ZodType } from 'zod';
import { DataTestIds } from 'test/dataTestIds';

import { CheckType } from 'types';
import { flattenKeys } from 'components/CheckForm/CheckForm.utils';
import { ANALYTICS_STEP_MAP, FORM_MAX_WIDTH } from 'components/CheckForm/FormLayout/FormLayout.constants';

import { normalizeFlattenedErrors, useFormLayout } from './formlayout.utils';
import { FormSection, FormSectionInternal, FormSectionProps } from './FormSection';
import { FormSidebar } from './FormSidebar';

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
  onSubmit: (
    onValid: SubmitHandler<T>,
    onInvalid: (errs: FieldErrors<T>) => void
  ) => (event: BaseSyntheticEvent) => void;
  onValid: SubmitHandler<T>;
  onInvalid?: (errs: FieldErrors<T>) => void;
  schema: ZodType;
  hasUnsavedChanges?: boolean;
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
  hasUnsavedChanges = true, // default to true to prevent accidentally disabling the submit button
}: FormLayoutProps<T>) => {
  const styles = useStyles2(getStyles);
  const {
    formState: { disabled },
  } = useFormContext();
  const { activeSection, setActiveSection, goToSection, setVisited, visitedSections } = useFormLayout(disabled);

  const sections = useMemo(() => {
    let index = -1;

    return (
      Children.map(children, (child) => {
        if (!isValidElement(child)) {
          return null;
        }

        if (child.type === FormSection) {
          index++;

          const sectionProps = child.props as Omit<FormSectionProps, 'index' | 'activeSection'>;

          return <FormSectionInternal {...sectionProps} index={index} activeSection={activeSection} />;
        }

        return child;
      }) || []
    );
  }, [activeSection, children]);

  const formSections = sections.filter((section) => section.type === FormSectionInternal);

  const handleVisited = useCallback(
    (indices: number[]) => {
      setVisited(indices);
    },
    [setVisited]
  );

  const handleValid = useCallback(
    (formValues: T, event: BaseSyntheticEvent | undefined) => {
      handleVisited(formSections.map((section) => section.props.index));
      onValid(formValues, event);
    },
    [handleVisited, onValid, formSections]
  );

  const handleInvalid = useCallback(
    (errs: FieldErrors<T>) => {
      handleVisited(formSections.map((section) => section.props.index));
      const flattenedErrors = normalizeFlattenedErrors(flattenKeys(errs));

      const errSection = formSections?.find((section) => {
        const fields = section.props.fields;

        return flattenedErrors.find((errName: string) => {
          return fields?.some((field: string) => errName.startsWith(field));
        });
      });

      if (errSection !== undefined) {
        setActiveSection(errSection.props.index);
      }

      onInvalid?.(errs);
    },
    [handleVisited, onInvalid, formSections, setActiveSection]
  );

  const actionButtons = actions?.find((action) => action.index === activeSection)?.element;

  const disableSubmit = !hasUnsavedChanges || disabled;

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <FormSidebar
          activeSection={activeSection}
          checkState={checkState}
          checkType={checkType}
          onSectionClick={goToSection}
          sections={formSections}
          visitedSections={visitedSections}
          schema={schema}
        />
        <form className={styles.form} onSubmit={onSubmit(handleValid, handleInvalid)}>
          <div>{sections}</div>

          <div>
            {alerts && <div className={styles.alerts}>{alerts}</div>}
            <hr />
            <div className={cx(styles.actionsBar, styles.sectionContent)} data-testid={DataTestIds.ACTIONS_BAR}>
              <div>
                {activeSection !== 0 && (
                  <Button
                    onClick={() => {
                      const newStep = activeSection - 1;
                      trackNavigateWizardForm({
                        checkState,
                        checkType,
                        component: 'back-button',
                        step: ANALYTICS_STEP_MAP[newStep],
                      });
                      goToSection(newStep);
                    }}
                    icon="arrow-left"
                    variant="secondary"
                  >
                    <Stack gap={0.5}>
                      <div>{activeSection}.</div>
                      <div>{formSections[activeSection - 1].props.label}</div>
                    </Stack>
                  </Button>
                )}
              </div>
              <Stack>
                {actionButtons}
                {activeSection < formSections.length - 1 && (
                  <Button
                    onClick={() => {
                      const newStep = activeSection + 1;
                      trackNavigateWizardForm({
                        checkState,
                        checkType,
                        component: 'forward-button',
                        step: ANALYTICS_STEP_MAP[newStep],
                      });
                      goToSection(newStep);
                    }}
                    icon="arrow-right"
                    type="button"
                  >
                    <Stack>
                      <div>{activeSection + 2}.</div>
                      <div>{formSections[activeSection + 1].props.label}</div>
                    </Stack>
                  </Button>
                )}
                <Button
                  data-testid={DataTestIds.CHECK_FORM_SUBMIT_BUTTON}
                  disabled={disableSubmit}
                  key="submit"
                  type="submit"
                >
                  Save
                </Button>
              </Stack>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = `formLayout`;
  const breakpoint = theme.breakpoints.values.md;
  const query = `(min-width: ${breakpoint + 1}px)`;
  const containerQuery = `@container ${containerName} ${query}`;
  const mediaQuery = `@supports not (container-type: inline-size) @media ${query}`;

  const containerRules = {
    gridTemplateColumns: `160px minmax(0, ${FORM_MAX_WIDTH})`,
    height: '100%',
  };

  return {
    wrapper: css({
      containerName,
      containerType: `inline-size`,
      height: '100%',
      contain: 'layout',
    }),
    container: css({
      display: 'grid',
      gap: theme.spacing(4),
      [containerQuery]: containerRules,
      [mediaQuery]: containerRules,
    }),
    form: css({
      display: 'flex',
      flexDirection: 'column',
      flexGrow: '1',
      justifyContent: 'space-between',
    }),
    sectionContent: css({
      maxWidth: FORM_MAX_WIDTH,
    }),
    alerts: css({
      marginTop: theme.spacing(2),
    }),
    actionsBar: css({ display: 'flex', justifyContent: 'space-between', maxWidth: FORM_MAX_WIDTH }),
  };
};

FormLayout.Section = FormSection;
