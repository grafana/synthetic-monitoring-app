import React, { ReactNode } from 'react';
import { FieldPath } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckFormValues } from 'types';

export type FormSectionProps = {
  activeSection: number;
  children: ReactNode;
  label: string;
  fields?: Array<FieldPath<CheckFormValues>>;
  index: number;
};

// return doesn't matter as we take over how this behaves internally
export const FormSection = (props: Omit<FormSectionProps, 'index' | 'activeSection'>) => {
  return props.children;
};

export const FormSectionInternal = ({ activeSection, children, label, index }: FormSectionProps) => {
  const styles = useStyles2(getStyles);
  const isActive = activeSection === index;

  if (!isActive) {
    return null;
  }

  return (
    <div data-fs-element={`Form section ${label}`}>
      <h2 className={cx(`h3`, styles.header)}>{`${index + 1}. ${label}`}</h2>
      <div className={styles.sectionContent}>{children}</div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    sectionContent: css({
      maxWidth: `800px`,
    }),
    header: css({
      marginBottom: theme.spacing(4),
    }),
  };
};
