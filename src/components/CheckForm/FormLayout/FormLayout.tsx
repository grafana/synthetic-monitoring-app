import React, { BaseSyntheticEvent, Children, isValidElement, ReactNode, useMemo } from 'react';
import { FieldErrors, FieldValues, SubmitHandler } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Stack, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { flatten } from 'flat';
import { ZodType } from 'zod';
import { DataTestIds } from 'test/dataTestIds';

import { findFieldToFocus, useFormLayout } from './formlayout.utils';
import { FormSection, FormSectionInternal } from './FormSection';
import { FormSidebar } from './FormSidebar';

type ActionNode = {
  index: number;
  element: ReactNode;
};

type FormLayoutProps<T extends FieldValues> = {
  actions?: ActionNode[];
  alerts?: ReactNode;
  children: ReactNode;
  onSubmit: (
    onValid: SubmitHandler<T>,
    onInvalid: (errs: FieldErrors<T>) => void
  ) => (event: BaseSyntheticEvent) => void;
  onValid: SubmitHandler<T>;
  onInvalid?: (errs: FieldErrors<T>) => void;
  schema: ZodType<T>;
};

export const FORM_MAX_WIDTH = `860px`;

export const FormLayout = <T extends FieldValues>({
  actions,
  alerts,
  children,
  onSubmit,
  onValid,
  onInvalid,
  schema,
}: FormLayoutProps<T>) => {
  const styles = useStyles2(getStyles);
  const { activeSection, setActiveSection, goToSection, setVisited, visitedSections } = useFormLayout();

  const sections = useMemo(() => {
    let index = -1;

    return (
      Children.map(children, (child) => {
        if (!isValidElement(child)) {
          return null;
        }

        if (child.type === FormSection) {
          index++;

          return <FormSectionInternal {...child.props} index={index} activeSection={activeSection} />;
        }

        return child;
      }) || []
    );
  }, [activeSection, children]);

  const formSections = sections.filter((section) => section.type === FormSectionInternal);

  const handleValid = (formValues: T, event: BaseSyntheticEvent | undefined) => {
    setVisited(sections.map((section) => section.props.index));
    onValid(formValues, event);
  };

  const handleError = (errs: FieldErrors<T>) => {
    setVisited(sections.map((section) => section.props.index));
    const flattenedErrors = Object.keys(flatten(errs));
    // Find the first section that has a field with an error.
    const errSection = sections?.find((section) =>
      flattenedErrors.find((errName: string) => {
        return section.props.fields?.some((field: string) => errName.startsWith(field));
      })
    );

    if (errSection !== undefined) {
      setActiveSection(errSection.props.index);
    }

    const shouldFocus = findFieldToFocus(errs);

    // can't pass refs to all fields so have to manage it automatically
    if (shouldFocus) {
      shouldFocus.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      shouldFocus.focus?.({ preventScroll: true });
    }

    onInvalid?.(errs);
  };

  const actionButtons = actions?.find((action) => action.index === activeSection)?.element;

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <FormSidebar
          activeSection={activeSection}
          onSectionClick={goToSection}
          sections={formSections}
          visitedSections={visitedSections}
          schema={schema}
        />
        <form className={styles.form} onSubmit={onSubmit(handleValid, handleError)}>
          <div>{sections}</div>

          <div>
            {alerts && <div className={styles.alerts}>{alerts}</div>}
            <hr />
            <div className={cx(styles.actionsBar, styles.sectionContent)}>
              <div>
                {activeSection !== 0 && (
                  <Button onClick={() => goToSection(activeSection - 1)} icon="arrow-left" variant="secondary">
                    <Stack gap={0.5}>
                      <div>{activeSection}.</div>
                      <div>{sections[activeSection - 1].props.label}</div>
                    </Stack>
                  </Button>
                )}
              </div>
              <Stack data-testid={DataTestIds.ACTIONS_BAR}>
                {actionButtons}
                {activeSection < formSections.length - 1 && (
                  <Button onClick={() => goToSection(activeSection + 1)} icon="arrow-right" type="button">
                    <Stack>
                      <div>{activeSection + 2}.</div>
                      <div>{sections[activeSection + 1].props.label}</div>
                    </Stack>
                  </Button>
                )}
                <Button key="submit" type="submit">
                  Submit
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
    gridTemplateColumns: `160px minmax(0, ${FORM_MAX_WIDTH}) minmax(50px, auto)`,
    height: '100%',
  };

  return {
    wrapper: css({
      containerName,
      containerType: `inline-size`,
      height: '100%',
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
