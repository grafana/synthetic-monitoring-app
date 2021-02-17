import { getLocationSrv } from '@grafana/runtime';
import React, { useContext } from 'react';
import { CheckHealth } from 'components/CheckHealth';
import { UptimeGauge } from 'components/UptimeGauge';
import { checkType as getCheckType, dashboardUID } from 'utils';
// Types
import { Check, CheckType, Label } from 'types';
import { Button, IconButton, HorizontalGroup, VerticalGroup, Container, useStyles, Checkbox } from '@grafana/ui';
import { css } from 'emotion';
import { InstanceContext } from './InstanceContext';
import { GrafanaTheme } from '@grafana/data';
import { calculateUsage } from 'checkUsageCalc';

interface Props {
  check: Check;
  onLabelSelect: (label: Label) => void;
}

const getStyles = (theme: GrafanaTheme) => ({
  cardWrapper: css`
    background-color: ${theme.colors.bg2};
    border: 1px solid #343b40;
    border-radius: 2px;
    width: 100%;
    padding: ${theme.spacing.md};
    cursor: pointer;
    margin-bottom: ${theme.spacing.sm};
  `,
});

export const CheckCard = ({ check, onLabelSelect }: Props) => {
  const { instance } = useContext(InstanceContext);
  const styles = useStyles(getStyles);
  const checkType = getCheckType(check.settings);

  const showDashboard = (check: Check, checkType: CheckType) => {
    const target = dashboardUID(checkType, instance.api);

    if (!target) {
      console.log('dashboard not found.', checkType);
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

  console.log(check, checkType);

  const usage = calculateUsage({
    probeCount: check.probes.length,
    checkType,
    frequencySeconds: check.frequency / 1000,
    useFullMetrics: !check.basicMetricsOnly,
  });

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        showDashboard(check, checkType);
      }}
      className={styles.cardWrapper}
      aria-label="check-card"
    >
      <HorizontalGroup justify="space-between">
        <div className="card-item-body">
          <Checkbox />
          <VerticalGroup>
            <div className="card-item-name">{check.job}</div>
            <div className="card-item-sub-name">{check.target}</div>
            <div>
              <span>{checkType} |</span>
              <span>{check.frequency / 1000}s frequency |</span>
              <span>
                {usage.activeSeries}
                &nbsp;active series
              </span>
            </div>
            <div>
              {check.labels.map((label: Label, index) => (
                <Button
                  variant="secondary"
                  key={index}
                  className={css`
                    border: none;
                    background: inherit;
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLabelSelect(label);
                  }}
                  type="button"
                >
                  {label.name}={label.value}
                </Button>
              ))}
            </div>
          </VerticalGroup>
          <HorizontalGroup>
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
          </HorizontalGroup>
        </div>
        <HorizontalGroup justify="flex-end">
          <UptimeGauge
            labelNames={['instance', 'job']}
            labelValues={[check.target, check.job]}
            height={70}
            width={150}
            sparkline={false}
          />
        </HorizontalGroup>
      </HorizontalGroup>
    </div>
  );
};
