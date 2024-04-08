import React, { Children, isValidElement, ReactNode } from 'react';
import { FieldErrors, FieldPath, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { flatten } from 'flat';

import { CheckFormValues } from 'types';
import { Collapse } from 'components/Collapse';
import { CollapseLabel } from 'components/CollapseLabel';

type FormLayoutProps = {
  children: ReactNode;
};

export const FormLayout = ({ children }: FormLayoutProps) => {
  let index = -1;

  return Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return null;
    }

    if (child.type === FormSection) {
      index++;

      return <FormSectionInternal {...child.props} index={index} />;
    }

    return child;
  });
};

type FormSectionProps = {
  children: ReactNode;
  contentClassName?: string;
  label: string;
  fields?: Array<FieldPath<CheckFormValues>>;
  isOpen?: boolean;
};

// return doesn't matter as we take over how this behaves internally
const FormSection = (props: FormSectionProps) => {
  return props.children;
};

const FormSectionInternal = ({
  children,
  contentClassName,
  index,
  label,
  fields,
  isOpen,
}: FormSectionProps & { index: number }) => {
  const iternalIsOpen = index === 0 || isOpen;
  const styles = useStyles2(getStyles);
  const { formState } = useFormContext<CheckFormValues>();
  const relevantErrors = checkForErrors(formState.errors, fields);
  const hasErrors = relevantErrors.length > 0;
  const theme = useTheme2();

  return (
    <div className={styles.stack}>
      <div className={styles.main}>
        <Collapse
          label={
            <CollapseLabel
              label={label}
              icon={hasErrors ? `exclamation-triangle` : undefined}
              iconColor={theme.colors.error.text}
            />
          }
          isOpen={iternalIsOpen}
          data-fs-element={`Form section ${label}`}
        >
          <div className={cx(styles.content, contentClassName)}>{children}</div>
        </Collapse>
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
    content: css({
      maxWidth: `600px`,
    }),
    stack: css({
      display: 'flex',
      gap: theme.spacing(2),
    }),
  };
};

FormLayout.Section = FormSection;
