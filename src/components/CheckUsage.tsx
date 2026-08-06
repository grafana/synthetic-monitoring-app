import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackCmabLinkClicked } from 'features/tracking/costAttributionEvents';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

import { CheckFormValues, CheckType } from 'types';
import { checkFormValuesToUsageCalcValues } from 'utils';
import { useTenantCostAttributionLabels } from 'data/useTenantCostAttributionLabels';
import { useUsageCalc } from 'hooks/useUsageCalc';
import { CMAB_URLS } from 'components/CostAttribution/CostAttribution.constants';
import { Toggletip } from 'components/Toggletip';

import {
  BILLED_TELEMETRY_ROWS,
  HIDE_TELEMETRY_FOR_TYPES,
  TEST_VOLUME_ROWS,
  UsageRowDefinition,
  UsageRowKey,
} from './CheckUsage.constants';

export const CheckUsage = ({ checkType }: { checkType: CheckType }) => {
  const styles = useStyles2(getStyles);
  const { watch } = useFormContext<CheckFormValues>();
  const checkFormValues = watch();
  const usage = useUsageCalc([checkFormValuesToUsageCalcValues(checkFormValues)]);
  const { data: calData } = useTenantCostAttributionLabels();
  const showCmabNudge = Boolean(calData && calData.names.length === 0);

  const hideTelemetry = HIDE_TELEMETRY_FOR_TYPES.includes(checkType);

  if (!usage) {
    return null;
  }

  const values: Record<UsageRowKey, string> = {
    executions: usage.checksPerMonth.toLocaleString(),
    series: usage.activeSeries.toLocaleString(),
    dpm: usage.dpm.toLocaleString(),
    logs: usage.logsGbPerMonth.toLocaleString(),
  };

  const billedTelemetryRows = hideTelemetry ? [] : BILLED_TELEMETRY_ROWS;

  return (
    <div data-testid={CHECKS_TEST_ID.usage} className={styles.container}>
      <Text element="h3" variant="h6">
        Estimated usage for this check
      </Text>
      {!hideTelemetry && (
        <TextLink
          href="https://grafana.com/docs/grafana-cloud/fundamentals/active-series-and-dpm/"
          className={styles.link}
          external
          variant="bodySmall"
        >
          Learn more about active series and data points per minute
        </TextLink>
      )}
      <div className={styles.block}>
        <div className={styles.group}>
          <div className={styles.caption}>Test volume</div>
          {TEST_VOLUME_ROWS.map((row) => (
            <UsageRow key={row.key} row={row} value={values[row.key]} />
          ))}
        </div>
        {billedTelemetryRows.length > 0 && (
          <div className={styles.group}>
            <div className={styles.caption}>Billed telemetry</div>
            {billedTelemetryRows.map((row) => (
              <UsageRow key={row.key} row={row} value={values[row.key]} />
            ))}
          </div>
        )}
        {billedTelemetryRows.length > 0 && showCmabNudge && (
          <div className={styles.footer}>
            <Icon className={styles.footerIcon} name="info-circle" size="sm" />
            <span>
              Active series, data points per minute and log volume count toward your Grafana Cloud usage.{' '}
              <TextLink
                href={CMAB_URLS.settings}
                external={true}
                variant="bodySmall"
                onClick={() => trackCmabLinkClicked({ source: 'check_form_usage_tooltip', metric: 'active_series' })}
              >
                Attribute check costs to teams and services
              </TextLink>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const UsageRow = ({ row, value }: { row: UsageRowDefinition; value: string }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.row} key={row.key}>
      <Icon className={styles.icon} name={row.icon} />
      <span className={styles.label}>{row.label}</span>
      <span className={styles.value}>
        <strong>
          {value}
          {row.unit && <span className={styles.unit}>{row.unit}</span>}
        </strong>
        <Toggletip contentClassName={styles.tooltipContent} content={<div>{row.description}</div>}>
          <button className={styles.infoButton} type="button" aria-label={`About ${row.label.toLowerCase()}`}>
            <Icon name="info-circle" size="sm" />
          </button>
        </Toggletip>
      </span>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    marginBottom: theme.spacing(6),
  }),
  block: css({
    maxWidth: '520px',
  }),
  group: css({
    marginTop: theme.spacing(1.75),
  }),
  caption: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(0.25),
    color: theme.colors.text.secondary,
    fontSize: theme.typography.pxToRem(10),
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',

    '&::after': {
      content: '""',
      flex: 1,
      height: '1px',
      background: theme.colors.border.weak,
    },
  }),
  row: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    minHeight: theme.spacing(3.75),
  }),
  label: css({
    minWidth: 0,
    color: theme.colors.text.secondary,
  }),
  icon: css({
    flexShrink: 0,
    color: theme.colors.text.secondary,
  }),
  value: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    marginLeft: 'auto',
  }),
  unit: css({
    marginLeft: theme.spacing(0.5),
    fontWeight: 400,
    color: theme.colors.text.secondary,
  }),
  infoButton: css({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    padding: 0,
    color: theme.colors.text.secondary,
    cursor: 'pointer',

    '&:hover': {
      color: theme.colors.text.primary,
    },
  }),
  link: css({
    textDecoration: 'underline',
  }),
  tooltipContent: css({
    maxWidth: '260px',
  }),
  footer: css({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1.75),
    paddingTop: theme.spacing(1.25),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  footerIcon: css({
    flexShrink: 0,
    marginTop: '2px',
    color: theme.colors.text.secondary,
  }),
});
