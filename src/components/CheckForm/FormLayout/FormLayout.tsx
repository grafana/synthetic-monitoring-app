import React, { BaseSyntheticEvent, Children, isValidElement, ReactNode, useMemo } from 'react';
import { FieldErrors, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { flatten } from 'flat';

import { CheckFormValues } from 'types';
import { CHECK_FORM_ERROR_EVENT } from 'components/constants';

import { findFieldToFocus, useFormLayout } from './formlayout.utils';
import { FormSection, FormSectionInternal } from './FormSection';
import { FormSidebar } from './FormSidebar';

type FormLayoutProps = {
  children: ReactNode;
};

const errorMessage = ``;

export const FormLayout = ({ children }: FormLayoutProps) => {
  const { handleSubmit: formSubmit } = useFormContext<CheckFormValues>();
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
  const handleSubmit = (checkValues: CheckFormValues, event: BaseSyntheticEvent | undefined) => {
    setVisited(sections.map((section) => section.props.index));
    // onSubmit(checkValues, event);
  };

  const handleError = (errs: FieldErrors<CheckFormValues>) => {
    setVisited(sections.map((section) => section.props.index));
    const flattenedErrors = Object.keys(flatten(errs));
    // Find the first section that has a field with an error.
    const errSection = sections?.find((section) =>
      flattenedErrors.find((errName: string) => {
        return section.props.fields?.some((field: string) => errName.startsWith(field));
      })
    );
    console.log(errs);

    if (errSection !== undefined) {
      setActiveSection(errSection.props.index);
    }

    const shouldFocus = findFieldToFocus(errs);

    // can't pass refs to all fields so have to manage it automatically
    if (shouldFocus) {
      shouldFocus.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      shouldFocus.focus?.({ preventScroll: true });
    }

    document.dispatchEvent(new CustomEvent(CHECK_FORM_ERROR_EVENT, { detail: errs }));
  };

  return (
    <form onSubmit={formSubmit(handleSubmit, handleError)} className={styles.wrapper}>
      <div className={styles.container}>
        <FormSidebar
          activeSection={activeSection}
          onSectionClick={goToSection}
          sections={formSections}
          visitedSections={visitedSections}
        />
        <div
          className={css({
            display: 'flex',
            flexDirection: 'column',
            flexGrow: '1',
            justifyContent: 'space-between',
          })}
        >
          <div>{sections}</div>

          <div>
            {errorMessage && (
              <div className={styles.submissionError}>
                <Alert title="Save failed" severity="error">
                  {errorMessage}
                </Alert>
              </div>
            )}
            <hr />
            <div className={cx(styles.actionsBar, styles.sectionContent)}>
              <div>
                {activeSection !== 0 && (
                  <Button onClick={() => goToSection(activeSection - 1)} icon="arrow-left" variant="secondary">
                    <div className={styles.stack}>
                      <div>{activeSection}.</div>
                      <div>{sections[activeSection - 1].props.label}</div>
                    </div>
                  </Button>
                )}
              </div>
              <div>
                {activeSection < formSections.length - 1 ? (
                  <Button onClick={() => goToSection(activeSection + 1)} icon="arrow-right" type="button">
                    <div className={styles.stack}>
                      <div>{activeSection + 2}.</div>
                      <div>{sections[activeSection + 1].props.label}</div>
                    </div>
                  </Button>
                ) : (
                  <Button key="submit" type="submit">
                    Submit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = `checkForm`;
  const breakpoint = theme.breakpoints.values.md;
  const query = `(min-width: ${breakpoint + 1}px)`;
  const containerQuery = `@container ${containerName} ${query}`;
  const mediaQuery = `@supports not (container-type: inline-size) @media ${query}`;

  return {
    stack: css({
      display: `flex`,
      gap: theme.spacing(0.5),
    }),
    wrapper: css({
      containerName,
      containerType: `inline-size`,
      height: '100%',
    }),
    container: css({
      display: 'grid',
      gap: theme.spacing(4),
      [containerQuery]: {
        gridTemplateColumns: `160px 1fr`,
        height: '100%',
      },
      [mediaQuery]: {
        gridTemplateColumns: `160px 1fr`,
        height: '100%',
      },
    }),
    sectionContent: css({
      maxWidth: `800px`,
    }),
    submissionError: css({
      marginTop: theme.spacing(2),
    }),
    actionsBar: css({ display: 'flex', justifyContent: 'space-between', maxWidth: `800px` }),
  };
};

FormLayout.Section = FormSection;
