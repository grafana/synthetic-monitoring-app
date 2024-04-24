import React, { Children, isValidElement, ReactNode, useState } from 'react';
import { FieldError, FieldPath, FormState, useFormContext, UseFormGetFieldState } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckFormTypeLayoutProps, CheckFormValues } from 'types';

import { FormSidebar } from './FormSidebar';

type FormLayoutProps = {
  children: ReactNode;
};

export const FormLayout = ({ children, formActions }: FormLayoutProps & CheckFormTypeLayoutProps) => {
  let index = -1;
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionHeaders: Array<{ label: string; hasErrors: boolean; required: boolean; complete: boolean }> = [];
  const { formState, trigger, getFieldState } = useFormContext<CheckFormValues>();
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

      const { errors, valid } = checkForErrors({ fields: child.props.fields, formState, getFieldState });
      sectionHeaders.push({
        label: child.props.label,
        hasErrors: errors.length > 0,
        required: child.props.required,
        complete: valid,
      });
      return <FormSectionInternal {...child.props} index={index} active={activeIndex === index} />;
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
          maxWidth: '800px',
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
                    trigger(sections?.[activeIndex].props.fields);
                    setActiveIndex(activeIndex + 1);
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
        <h2 className={cx(`h3`, styles.header)}>{`${index + 1}. ${label}`}</h2>
        <div className={cx(styles.content, contentClassName)}>{children}</div>
      </div>
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
  let valid = true;
  let touched = false;
  let errors: FieldError[] = [];
  fields.forEach((field) => {
    const fieldState = getFieldState(field, formState);

    if (fieldState.isTouched || fieldState.isDirty) {
      touched = true;
    }
    if (fieldState.invalid || fieldState.error) {
      valid = false;
    }
    if (fieldState.error) {
      errors.push(fieldState.error);
    }
  });
  return { valid: valid && touched, errors };
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
