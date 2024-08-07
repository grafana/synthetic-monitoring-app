import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { Label } from 'types';
import { CheckCardLabel } from 'components/CheckCardLabel';
import { Trans } from 'components/i18n';

interface CheckListItemDetailsProps {
  frequency: number;
  activeSeries?: number;
  probeLocations: number;
  executionsRate?: number;
  className?: string;
  labelCount?: number;
  labels?: Label[];
  onLabelClick?: (label: Label) => void;
}

export const CheckListItemDetails = ({
  frequency,
  activeSeries,
  probeLocations,
  executionsRate,
  className,
  labels,
  onLabelClick,
}: CheckListItemDetailsProps) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.checkDetails, className)}>
      <div>
        <Trans i18nKey={`checks.card.frequency`}>
          {{ frequency: frequency / 1000 }}
          {{ unit: 's' }} frequency
        </Trans>
      </div>
      {activeSeries && (
        <div>
          <Trans i18nKey="check.frequency">{{ series: activeSeries }} active series</Trans>
        </div>
      )}
      <div>
        <Trans i18nKey="check.probe-location" count={probeLocations}>
          {{ locations: probeLocations }} locations
        </Trans>
      </div>
      {executionsRate && (
        <div>
          <Trans i18nKey={`check.executions-rate`}>{{ rate: executionsRate }} executions / month</Trans>
        </div>
      )}
      {labels && onLabelClick && (
        <>
          <Tooltip
            placement="bottom-end"
            content={
              <Stack justifyContent="flex-end" wrap={'wrap'}>
                {labels.map((label: Label, index) => (
                  <CheckCardLabel
                    key={index}
                    label={label}
                    onLabelSelect={onLabelClick}
                    className={styles.labelWidth}
                  />
                ))}
              </Stack>
            }
          >
            <Button disabled={labels.length === 0} type="button" fill="text" size="sm">
              <Trans i18nKey={`check.view-labels`} count={labels.length}>
                View {{ count: labels.length }} label
              </Trans>
            </Button>
          </Tooltip>
        </>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  checkDetails: css({
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: theme.typography.bodySmall.lineHeight,
    whiteSpace: `nowrap`,
    display: `flex`,
    gap: theme.spacing(1),
    alignItems: `center`,
    width: `600px`,

    [`> div:not(:last-child)`]: css({
      paddingRight: theme.spacing(1),
      borderRight: `1px solid currentColor`,
    }),
  }),
  labelWidth: css({
    maxWidth: `350px`,
  }),
});
