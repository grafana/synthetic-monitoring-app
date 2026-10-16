import React from 'react';
import { useFormContext } from 'react-hook-form';
import { urlUtil } from '@grafana/data';
import { TextLink } from '@grafana/ui';

import { CheckAlertType, CheckFormValuesWithAlert } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { DEFAULT_QUERY_FROM_TIME } from 'components/constants';

import { PredefinedAlertInterface } from './AlertsPerCheck.constants';
import { FailedExecutionsAlert } from './FailedExecutionsAlert';
import { RequestDurationTooHighAvgAlert } from './RequestDurationTooHighAvgAlert';
import { TLSTargetCertificateCloseToExpiringAlert } from './TLSTargetCertificateCloseToExpiringAlert';

function createExploreLink(dataSourceName: string, query: string) {
  return urlUtil.renderUrl(`/explore`, {
    left: JSON.stringify([
      `now-${DEFAULT_QUERY_FROM_TIME}`,
      'now',
      dataSourceName,
      { datasource: dataSourceName, expr: query },
    ]),
  });
}

export const AlertCondition = ({ alert, selected }: { alert: PredefinedAlertInterface; selected: boolean }) => {
  const { getValues } = useFormContext<CheckFormValuesWithAlert<typeof alert.type>>();

  const ds = useMetricsDS();

  const job = getValues('job');
  const instance = getValues('target');
  const threshold = getValues(`alerts.${alert.type}.threshold`);
  const period = getValues(`alerts.${alert.type}.period`);
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

  if (alert.type === CheckAlertType.ProbeFailedExecutionsTooHigh) {
    return <FailedExecutionsAlert alert={alert} selected={selected} tooltipContent={tooltipContent} />;
  }

  if (alert.type === CheckAlertType.TLSTargetCertificateCloseToExpiring) {
    return (
      <TLSTargetCertificateCloseToExpiringAlert alert={alert} selected={selected} tooltipContent={tooltipContent} />
    );
  }

  return <RequestDurationTooHighAvgAlert alert={alert} selected={selected} tooltipContent={tooltipContent} />;
};
