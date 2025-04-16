import React, { ReactNode } from 'react';
import { FieldPath } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';
import { FORM_MAX_WIDTH } from 'components/CheckForm/FormLayout/FormLayout.constants';
import { CheckStatusInfo, type CheckStatusInfoProps } from 'components/CheckStatusInfo';
import { NewStatusBadge } from 'components/NewStatusBadge';

export type FormSectionProps = {
  activeSection: number;
  children: ReactNode;
  label: string;
  fields?: Array<FieldPath<CheckFormValues>>;
  index: number;
  status?: CheckStatusInfoProps;
};

// return doesn't matter as we take over how this behaves internally
export const FormSection = (props: Omit<FormSectionProps, 'index' | 'activeSection'>) => {
  return props.children;
};

export const FormSectionInternal = ({ activeSection, children, label, index, status }: FormSectionProps) => {
  const styles = useStyles2(getStyles);
  const isActive = activeSection === index;

  if (!isActive) {
    return null;
  }

  return (
    <div data-fs-element={`Form section ${label}`} className={styles.formContainer}>
      <Box marginBottom={4}>
        <Text element="h2" variant="h3">
          <div className={styles.header}>
            {`${index + 1}. ${label}`}
            <Stack gap={1}>
              {status?.value && <NewStatusBadge status={status.value} />}
              {status && <CheckStatusInfo {...status} />}
            </Stack>
          </div>
        </Text>
      </Box>
      <div className={styles.sectionContent}>{children}</div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    header: css({
      position: 'relative',
      display: 'flex',
      gap: theme.spacing(2),
    }),
    sectionContent: css({
      maxWidth: FORM_MAX_WIDTH,
    }),

    formContainer: css({
      position: 'relative',
    }),
  };
};
