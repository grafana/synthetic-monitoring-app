import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2, urlUtil } from '@grafana/data';
import { Checkbox, Field, Icon, Input, Label, Stack, TextLink, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckAlertType, CheckFormValues } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';
import { PredefinedAlertInterface } from './AlertsPerCheck.constants';

function createExploreLink(dataSourceName: string, query: string) {
  return urlUtil.renderUrl(`/explore`, {
    left: JSON.stringify([
      'now-5m',
      'now',
      dataSourceName,
      { datasource: dataSourceName, expr: query },
      { ui: [true, true, true, 'none'] },
    ]),
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
  const styles = useStyles2(getStyles);

  const { control, formState, getValues } = useFormContext<CheckFormValues>();
  const { isFormDisabled } = useCheckFormContext();

  const handleToggleAlert = (type: CheckAlertType) => {
    onSelectionChange(type);
  };

  const thresholdError = formState.errors?.alerts?.[alert.type]?.threshold?.message;

  const ds = useMetricsDS();

  const job = getValues('job');
  const instance = getValues('target');

  const query = alert.query.replace(/\$instance/g, instance).replace(/\$job/g, job);
  const exploreLink = ds && createExploreLink(ds.name, query);
  const tooltipContent = (
    <div>
      {alert.description}.{' '}
      {exploreLink && (
        <TextLink href={exploreLink} external={true} variant="bodySmall">
          Explore query
        </TextLink>
      )}
    </div>
  );

  return (
    <div key={alert.type} className={styles.item}>
      <div className={styles.itemInfo}>
        <Checkbox id={`alert-${alert.type}`} onClick={() => handleToggleAlert(alert.type)} checked={selected} />

        <Tooltip content={tooltipContent} placement="bottom" interactive={true}>
          <Stack alignItems="center">
            <Label htmlFor={`alert-${alert.type}`} className={styles.columnLabel}>
              {alert.name}
            </Label>
            <Icon name="info-circle" />
          </Stack>
        </Tooltip>
      </div>
      <div className={styles.thresholdInput}>
        <Field
          label="Threshold"
          htmlFor={`alert-threshold-${alert.type}`}
          invalid={!!thresholdError}
          error={thresholdError}
        >
          <Controller
            name={`alerts.${alert.type}.threshold`}
            control={control}
            render={({ field }) => {
              return (
                <Input
                  {...field}
                  aria-disabled={!selected}
                  suffix={alert.unit}
                  type="number"
                  step="any"
                  id={`alert-threshold-${alert.type}`}
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    return field.onChange(value !== '' ? Number(value) : '');
                  }}
                  width={10}
                  disabled={!selected || isFormDisabled}
                />
              );
            }}
          />
        </Field>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  item: css({
    display: `flex`,
    gap: theme.spacing(1),
    marginLeft: theme.spacing(1),
  }),

  itemInfo: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    width: '50%',
    textWrap: 'wrap',
  }),

  columnLabel: css({
    fontWeight: theme.typography.fontWeightLight,
    fontSize: theme.typography.h6.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    marginBottom: '0',
  }),

  thresholdInput: css({
    marginLeft: '22px',
  }),
});
