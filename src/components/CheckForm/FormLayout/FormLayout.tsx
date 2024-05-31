import React, { BaseSyntheticEvent, Children, isValidElement, ReactNode, useState } from 'react';
import { FieldErrors, FieldPath, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { flatten } from 'flat';
import { ZodType } from 'zod';

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
  schema,
}: FormLayoutProps & CheckFormTypeLayoutProps) => {
  let index = -1;
  const [activeIndex, setActiveIndex] = useState(0);
  const [visitedSections, setVisitedSections] = useState(new Set<number>());
  const sectionHeaders: FormSidebarSection[] = [];
  const { getValues, handleSubmit: formSubmit } = useFormContext<CheckFormValues>();
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

      const values = getValues();
      const { errors } = checkForErrors({
        fields: child.props.fields,
        values,
        schema,
      });

      const visited = visitedSections.has(index);

      sectionHeaders.push({
        label: child.props.label,
        hasErrors: visited && errors.length > 0,
        required: child.props.required,
        visited,
      });
      return <FormSectionInternal {...child.props} index={index} active={activeIndex === index} />;
    }

    return child;
  });

  const navToIndex = (destinationIndex: number) => {
    setVisitedSections((v) => v.add(activeIndex));
    setActiveIndex(destinationIndex);
  };

  const markAllSectionsVisited = () => {
    setVisitedSections(new Set(Array.from({ length: sectionCount }, (_, i) => i)));
  };

  const handleSubmit = (checkValues: CheckFormValues, event: BaseSyntheticEvent | undefined) => {
    markAllSectionsVisited();
    onSubmit(checkValues, event);
  };

  const handleError = (errs: FieldErrors<CheckFormValues>) => {
    markAllSectionsVisited();
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
    <form onSubmit={formSubmit(handleSubmit, handleError)} className={styles.wrapper}>
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
            )}
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
  fields = [],
  values,
  schema,
}: {
  values: CheckFormValues;
  fields: Array<FieldPath<CheckFormValues>>;
  schema: ZodType<CheckFormValues>;
}) {
  const result = schema.safeParse(values);

  if (!result.success) {
    const errors = result.error.errors.reduce<string[]>((acc, err) => {
      const path = err.path.join('.');
      const isRelevant = fields.some((f) => path.startsWith(f));

      if (isRelevant) {
        return [...acc, path];
      }

      return acc;
    }, []);
    return {
      errors,
    };
  }

  return {
    errors: [],
  };
}

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = `checkForm`;
  const breakpoint = theme.breakpoints.values.md;
  const query = `(min-width: ${breakpoint + 1}px)`;
  const containerQuery = `@container ${containerName} ${query}`;
  const mediaQuery = `@supports not (container-type: inline-size) @media ${query}`;

  return {
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
    submissionError: css({
      marginTop: theme.spacing(2),
    }),
    section: css({
      containerName,
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
