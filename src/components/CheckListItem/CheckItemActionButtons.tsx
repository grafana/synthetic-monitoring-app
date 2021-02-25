import { GrafanaTheme, AppEvents } from '@grafana/data';
import { ButtonGroup, IconButton, useStyles } from '@grafana/ui';
import React, { useContext } from 'react';
import { css } from 'emotion';
import { Check, CheckType } from 'types';
import { dashboardUID, checkType as getCheckType } from 'utils';
import { InstanceContext } from 'components/InstanceContext';
import appEvents from 'grafana/app/core/app_events';
import { getLocationSrv } from '@grafana/runtime';
import { CheckStatusPill } from 'components/CheckStatusPill';

const getStyles = (theme: GrafanaTheme) => ({
  actionButtonGroup: css`
    display: flex;
    align-items: center;
  `,

  statusPill: css`
    margin-right: ${theme.spacing.xs};
  `,
});

interface Props {
  check: Check;
}
export const CheckItemActionButtons = ({ check }: Props) => {
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
    <div className={styles.actionButtonGroup}>
      <CheckStatusPill enabled={check.enabled} className={styles.statusPill} />
      <ButtonGroup>
        <IconButton name="apps" onClick={() => showDashboard(check, checkType)} />
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
    </div>
  );
};
