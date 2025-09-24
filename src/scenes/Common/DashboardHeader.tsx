import React from 'react';
import { AnnotationQuery, GrafanaTheme2 } from '@grafana/data';
import { RefreshPicker, TimeRangePicker, VariableControl } from '@grafana/scenes-react';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { DashboardAnnotationControls } from 'scenes/Common/DashboardAnnotationControls';
import { EditCheckButton } from 'scenes/Common/EditCheckButton';

interface DashboardHeaderProps {
  annotations: AnnotationQuery[];
  check: Check;
}

export const DashboardHeader = ({ annotations, check }: DashboardHeaderProps) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.variableControls}>
          <VariableControl name="probe" />
          <DashboardAnnotationControls annotations={annotations} />
        </div>
        <div className={styles.actions}>
          <EditCheckButton id={check.id} />
          <div className={styles.dashboardControls}>
            <TimeRangePicker />
            <RefreshPicker />
          </div>
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = 'dashboard-container';
  const breakpoint = theme.breakpoints.values.lg;
  const query = `(max-width: ${breakpoint}px)`;
  const containerQuery = `@container ${containerName} ${query}`;

  return {
    container: css`
      container-name: ${containerName};
      container-type: inline-size;
    `,
    header: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${theme.spacing(1)};

      ${containerQuery} {
        flex-direction: column;
      }
    `,
    variableControls: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${theme.spacing(2)};

      ${containerQuery} {
        justify-content: space-between;
        width: 100%;
      }
    `,
    actions: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${theme.spacing(2)};

      ${containerQuery} {
        width: 100%;
      }
    `,
    dashboardControls: css`
      display: flex;
      gap: ${theme.spacing(1)};
    `,
  };
};
