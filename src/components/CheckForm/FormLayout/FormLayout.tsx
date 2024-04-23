import React, { Children, isValidElement, ReactNode, useState } from 'react';
import { FieldErrors, FieldPath, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { flatten } from 'flat';

import { CheckFormTypeLayoutProps, CheckFormValues } from 'types';

import { FormSidebar } from './FormSidebar';

type FormLayoutProps = {
  children: ReactNode;
};

export const FormLayout = ({ children, formActions }: FormLayoutProps & CheckFormTypeLayoutProps) => {
  let index = -1;
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionHeaders: Array<{ label: string; hasErrors: boolean; required: boolean }> = [];
  const { formState, trigger } = useFormContext<CheckFormValues>();
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

      const errors = checkForErrors(formState.errors, child.props.fields);
      sectionHeaders.push({ label: child.props.label, hasErrors: errors.length > 0, required: child.props.required });
      return (
        <FormSectionInternal
          {...child.props}
          index={index}
          active={activeIndex === index}
          onNextClick={
            index !== sectionCount - 1
              ? () => {
                  trigger(child.props.fields).then((valid) => {
                    if (valid) {
                      setActiveIndex(activeIndex + 1);
                    }
                  });
                }
              : undefined
          }
        />
      );
    }

    return child;
  });

  return (
    <div className={css({ display: 'flex', flexDirection: 'row', height: '100%' })}>
      <FormSidebar sections={sectionHeaders} onSectionSelect={setActiveIndex} activeIndex={activeIndex} />
      <div
        className={css({
          display: 'flex',
          flexDirection: 'column',
          flexGrow: '1',
          justifyContent: 'space-between',
        })}
      >
        <div className={css({ paddingLeft: '24px' })}>{sections}</div>
        <div>
          <hr className={css({ width: '100%' })} />
          <div className={css({ display: 'flex', justifyContent: 'space-between', bottom: '0' })}>
            <div className={styles.buttonGroup}>
              {activeIndex !== 0 && (
                <Button onClick={() => setActiveIndex(activeIndex - 1)} icon="arrow-left" variant="secondary">
                  {sectionHeaders[activeIndex - 1].label}
                </Button>
              )}
              {activeIndex !== sectionHeaders.length - 1 && (
                <Button
                  onClick={() => {
                    trigger(sections?.[activeIndex].props.fields).then((valid) => {
                      if (valid) {
                        setActiveIndex(activeIndex + 1);
                      }
                    });
                  }}
                  icon="arrow-right"
                >
                  {sectionHeaders[activeIndex + 1].label}
                </Button>
              )}
            </div>
            <div className={styles.buttonGroup}>{formActions}</div>
          </div>
        </div>
      </div>
    </div>
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
      className={cx(styles.stack, { [css({ display: 'none' })]: !active })}
      data-fs-element={`Form section ${label}`}
    >
      <div className={styles.main}>
        <h3 className={styles.header}>
          {index + 1}.&nbsp;{label}
        </h3>
        <div className={cx(styles.content, contentClassName)}>{children}</div>
      </div>
    </div>
  );
};

function checkForErrors(errors: FieldErrors<CheckFormValues>, fields: Array<FieldPath<CheckFormValues>> = []) {
  const flattenedErrors = Object.keys(flatten(errors));
  const typeErrors = flattenedErrors.filter((error) => error.endsWith('.type')).map((error) => error.split('.type')[0]);
  const relevantErrors = typeErrors.filter((error) => {
    if (fields.some((field) => error.startsWith(field))) {
      return true;
    }

    return false;
  });

  return relevantErrors;
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    main: css({
      flex: 1,
    }),
    header: css({
      marginBottom: theme.spacing(4),
    }),
    content: css({
      maxWidth: `800px`,
    }),
    buttonGroup: css({
      display: 'flex',
      gap: theme.spacing(1),
    }),
    stack: css({
      display: 'flex',
      gap: theme.spacing(2),
    }),
  };
};

FormLayout.Section = FormSection;
