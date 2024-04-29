import React, { Children, isValidElement, ReactNode, useState } from 'react';
import { FieldError, FieldErrors, FieldPath, FormState, useFormContext, UseFormGetFieldState } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { flatten } from 'flat';

import { CheckFormTypeLayoutProps, CheckFormValues } from 'types';
import { PROBES_SELECT_ID } from 'components/CheckEditor/CheckProbes';
import { CHECK_FORM_ERROR_EVENT } from 'components/constants';

import { FormSidebar, FormSidebarSection } from './FormSidebar';

type FormLayoutProps = {
  children: ReactNode;
  errorMessage?: string;
};

export const FormLayout = ({
  children,
  formActions,
  onSubmit,
  onSubmitError,
  errorMessage,
}: FormLayoutProps & CheckFormTypeLayoutProps) => {
  let index = -1;
  const [activeIndex, setActiveIndex] = useState(0);
  const [visited, setVisited] = useState(new Set<number>());
  const sectionHeaders: FormSidebarSection[] = [];
  const { formState, trigger, getFieldState, handleSubmit } = useFormContext<CheckFormValues>();
  const styles = useStyles2(getStyles);

  let sectionCount = 0;
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }
    if (child?.type === FormSection) {
      sectionCount++;
    }
  });
  const sections = Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return null;
    }

    if (child.type === FormSection) {
      index++;

      const { errors } = checkForErrors({
        fields: child.props.fields,
        formState,
        getFieldState,
      });
      sectionHeaders.push({
        label: child.props.label,
        hasErrors: errors.length > 0,
        required: child.props.required,
        visited: visited.has(index),
      });
      return <FormSectionInternal {...child.props} index={index} active={activeIndex === index} />;
    }

    return child;
  });

  const navToIndex = (destinationIndex: number) => {
    trigger(sections?.[activeIndex].props.fields);
    setVisited((v) => v.add(activeIndex));
    setActiveIndex(destinationIndex);
  };

  const handleError = (errs: FieldErrors<CheckFormValues>) => {
    const flattenedErrors = Object.keys(flatten(errs));
    // Find the first section that has a field with an error.
    const errSection = sections?.find((section) =>
      flattenedErrors.find((errName: string) => {
        return section.props.fields?.some((field: string) => errName.startsWith(field));
      })
    );
    if (errSection !== undefined) {
      setActiveIndex(errSection.props.index);
    }

    const shouldFocus = findFieldToFocus(errs);

    // can't pass refs to all fields so have to manage it automatically
    if (shouldFocus) {
      shouldFocus.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      shouldFocus.focus?.({ preventScroll: true });
    }

    document.dispatchEvent(new CustomEvent(CHECK_FORM_ERROR_EVENT, { detail: errs }));
    if (onSubmitError) {
      onSubmitError(errs);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, handleError)} className={styles.wrapper}>
      <div className={styles.container}>
        <FormSidebar sections={sectionHeaders} onSectionSelect={navToIndex} activeIndex={activeIndex} />
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
            )}{' '}
            <hr />
            <div className={cx(styles.actionsBar, styles.sectionContent)}>
              <div className={styles.buttonGroup}>
                {activeIndex !== 0 && (
                  <Button onClick={() => navToIndex(activeIndex - 1)} icon="arrow-left" variant="secondary">
                    {sectionHeaders[activeIndex - 1].label}
                  </Button>
                )}
                {activeIndex !== sectionHeaders.length - 1 && (
                  <Button onClick={() => navToIndex(activeIndex + 1)} icon="arrow-right">
                    {sectionHeaders[activeIndex + 1].label}
                  </Button>
                )}
              </div>
              <div className={styles.buttonGroup}>{formActions}</div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

type FormSectionProps = {
  children: ReactNode;
  contentClassName?: string;
  label: string;
  fields?: Array<FieldPath<CheckFormValues>>;
  required?: boolean;
};

// return doesn't matter as we take over how this behaves internally
const FormSection = (props: FormSectionProps) => {
  return props.children;
};

const FormSectionInternal = ({
  children,
  contentClassName,
  label,
  active,
  index,
}: FormSectionProps & {
  index: number;
  active: boolean;
}) => {
  const styles = useStyles2(getStyles);

  return (
    <div
      className={cx(styles.section, { [css({ display: 'none' })]: !active })}
      data-fs-element={`Form section ${label}`}
    >
      <h2 className={cx(`h3`, styles.header)}>{`${index + 1}. ${label}`}</h2>
      <div className={cx(styles.sectionContent, contentClassName)}>{children}</div>
    </div>
  );
};

function checkForErrors({
  formState,
  fields = [],
  getFieldState,
}: {
  formState: FormState<CheckFormValues>;
  fields: Array<FieldPath<CheckFormValues>>;
  getFieldState: UseFormGetFieldState<CheckFormValues>;
}) {
  const errors: FieldError[] = [];
  fields.forEach((field) => {
    const fieldState = getFieldState(field, formState);
    if (fieldState.error) {
      errors.push(fieldState.error);
    }
  });
  return { errors };
}

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = `checkForm`;
  // const breakpoint = theme.breakpoints.values.xs;
  // const query = `(min-width: ${breakpoint + 1}px)`;
  // const containerQuery = `@container ${containerName} ${query}`;
  // const mediaQuery = `@supports not (container-type: inline-size) @media ${query}`;

  return {
    wrapper: css({
      // containerName,
      // containerType: `inline-size`,
      height: '100%',
    }),
    container: css({
      display: 'grid',
      gap: theme.spacing(4),

      gridTemplateColumns: `240px 1fr`,
      height: '100%',
      // [containerQuery]: {
      // },
      // [mediaQuery]: {
      //   gridTemplateColumns: `240px 1fr`,
      //   height: '100%',
      // },
    }),
    submissionError: css({
      marginTop: theme.spacing(2),
    }),
    section: css({
      containerName,
      flex: 1,
    }),
    sectionContent: css({
      maxWidth: `800px`,
    }),
    header: css({
      marginBottom: theme.spacing(4),
    }),
    actionsBar: css({ display: 'flex', justifyContent: 'space-between', maxWidth: `800px` }),
    buttonGroup: css({
      display: 'flex',
      gap: theme.spacing(1),
    }),
  };
};

FormLayout.Section = FormSection;

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
