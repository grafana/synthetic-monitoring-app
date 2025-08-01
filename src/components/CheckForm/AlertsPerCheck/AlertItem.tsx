import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2, urlUtil } from '@grafana/data';
import { TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckAlertType, CheckFormValues } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { NotOkStatusInfo } from 'components/AlertStatus/NotOkStatusInfo';

import { PredefinedAlertInterface } from './AlertsPerCheck.constants';
import { FailedExecutionsAlert } from './FailedExecutionsAlert';
import { RequestDurationTooHighAvgAlert } from './RequestDurationTooHighAvgAlert';
import { TLSTargetCertificateCloseToExpiringAlert } from './TLSTargetCertificateCloseToExpiringAlert';

function createExploreLink(dataSourceName: string, query: string) {
  return urlUtil.renderUrl(`/explore`, {
    left: JSON.stringify(['now-3h', 'now', dataSourceName, { datasource: dataSourceName, expr: query }]),
  });
}

export const AlertItem = ({
  alert,
  selected,
  onSelectionChange,
}: {
  alert: PredefinedAlertInterface;
  selected: boolean;
  onSelectionChange: (type: CheckAlertType) => void;
}) => {
  const styles = useStyles2(getAlertItemStyles);

  const { getValues } = useFormContext<CheckFormValues>();

  const handleToggleAlert = (type: CheckAlertType) => {
    onSelectionChange(type);
  };

  const ds = useMetricsDS();

  const job = getValues('job');
  const instance = getValues('target');
  const threshold = getValues(`alerts.${alert.type}.threshold`);
  const period = getValues(`alerts.${alert.type}.period`);
  const status = getValues(`alerts.${alert.type}.status`);
  const creationError = getValues(`alerts.${alert.type}.creationError`);

  const query = alert.query
    .replace(/\$instance/g, instance)
    .replace(/\$job/g, job)
    .replace(/\$threshold/g, threshold)
    .replace(/\$period/g, period);

  const exploreLink = ds && getValues('id') && threshold && createExploreLink(ds.name, query);
  const tooltipContent = (
    <div>
      {alert.description.replace(/\$threshold/g, threshold)}{' '}
      {exploreLink && (
        <div>
          <TextLink href={exploreLink} external={true} variant="bodySmall">
            Explore query
          </TextLink>
        </div>
      )}
    </div>
  );

  return (
    <div key={alert.type} className={styles.item}>
      {alert.type === CheckAlertType.ProbeFailedExecutionsTooHigh && (
        <FailedExecutionsAlert
          alert={alert}
          selected={selected}
          onSelectionChange={handleToggleAlert}
          tooltipContent={tooltipContent}
        />
      )}

      {alert.type === CheckAlertType.TLSTargetCertificateCloseToExpiring && (
        <TLSTargetCertificateCloseToExpiringAlert
          alert={alert}
          selected={selected}
          onSelectionChange={handleToggleAlert}
          tooltipContent={tooltipContent}
        />
      )}
      {(alert.type === CheckAlertType.HTTPRequestDurationTooHighAvg ||
        alert.type === CheckAlertType.PingRequestDurationTooHighAvg ||
        alert.type === CheckAlertType.DNSRequestDurationTooHighAvg) && (
        <RequestDurationTooHighAvgAlert
          alert={alert}
          selected={selected}
          onSelectionChange={handleToggleAlert}
          tooltipContent={tooltipContent}
        />
      )}
      {status && status !== 'OK' && (
        <div className={styles.alertStatus} data-testid={`alert-error-status-${alert.type}`}>
          <NotOkStatusInfo status={status} error={creationError} />
        </div>
      )}
    </div>
  );
};

export const getAlertItemStyles = (theme: GrafanaTheme2) => ({
  item: css({
    display: `flex`,
    gap: theme.spacing(1),
    marginLeft: theme.spacing(1),
    minHeight: '40px',
    paddingTop: theme.spacing(1),
    justifyContent: 'space-between',
  }),
  alertStatus: css({
    marginLeft: 'auto',
  }),
  alertRow: css({
    gap: theme.spacing(1),
    alignItems: 'flex-start',
    '& > *': {
      marginTop: theme.spacing(0.5),
    },
  }),
  alertCheckbox: css({
    marginTop: theme.spacing(0.75),
  }),
  alertTooltip: css({
    marginTop: theme.spacing(1),
  }),
});
