import { GrafanaTheme, AppEvents } from '@grafana/data';
import { Button, ButtonGroup, IconButton, useStyles } from '@grafana/ui';
import React, { useContext } from 'react';
import { css } from 'emotion';
import { Check, CheckType } from 'types';
import { dashboardUID, checkType as getCheckType } from 'utils';
import { InstanceContext } from 'components/InstanceContext';
import appEvents from 'grafana/app/core/app_events';
import { getLocationSrv } from '@grafana/runtime';

const getStyles = (theme: GrafanaTheme) => ({
  actionButtonGroup: css`
    display: flex;
    align-items: center;
  `,
});

interface Props {
  check: Check;
  showViewDashboard?: boolean;
}

export const CheckItemActionButtons = ({ check, showViewDashboard }: Props) => {
  const styles = useStyles(getStyles);
  const checkType = getCheckType(check.settings);
  const { instance } = useContext(InstanceContext);

  const showDashboard = (check: Check, checkType: CheckType) => {
    const target = dashboardUID(checkType, instance.api);

    if (!target) {
      appEvents.emit(AppEvents.alertError, ['Dashboard not found']);
      return;
    }

    getLocationSrv().update({
      partial: false,
      path: `d/${target.uid}`,
      query: {
        'var-instance': check.target,
        'var-job': check.job,
      },
    });
  };

  return (
    <ButtonGroup className={styles.actionButtonGroup}>
      {showViewDashboard && (
        <Button onClick={() => showDashboard(check, checkType)} size="sm" variant="link">
          View dashboard
        </Button>
      )}
      <IconButton
        name="pen"
        onClick={() => {
          getLocationSrv().update({
            partial: true,
            query: {
              id: check.id,
            },
          });
        }}
      />
      <IconButton name="trash-alt" />
    </ButtonGroup>
  );
};
