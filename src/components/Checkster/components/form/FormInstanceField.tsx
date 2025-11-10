import React from 'react';
import { Icon, Stack, Tooltip, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { GenericInputField } from './generic/GenericInputField';

export function FormInstanceField({ field }: { field: 'target' }) {
  const theme = useTheme2();
  return (
    <GenericInputField
      data-testid={CHECKSTER_TEST_ID.form.inputs.instance}
      field={field}
      label="Instance"
      description={
        <Stack gap={1}>
          <span>
            Metrics and logs produced as a result of this check will follow the Prometheus convention of being
            identified by a job and instance.
          </span>
          <Tooltip
            content={
              <span>
                The job/instance pair is guaranteed unique and the method by which results are queried. Read more about
                the job/instance convention at prometheus.io
              </span>
            }
          >
            <Icon
              color="primary"
              name="info-circle"
              className={css`
                font-weight: ${theme.typography.fontWeightLight};
              `}
            />
          </Tooltip>
        </Stack>
      }
      required
    />
  );
}
