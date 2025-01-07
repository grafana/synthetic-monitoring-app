import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Label, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckAlertFormValues, CheckAlertType } from 'types';

import { AlertItem } from './AlertItem';
import { PredefinedAlertInterface } from './AlertsPerCheck.constants';

export const AlertsList = ({
  title,
  alerts,
  selectedAlerts,
  onSelectionChange,
}: {
  title: string;
  alerts: PredefinedAlertInterface[];
  selectedAlerts?: Partial<Record<CheckAlertType, CheckAlertFormValues>>;
  onSelectionChange: (type: CheckAlertType) => void;
}) => {
  const styles = useStyles2(getStyles);

  const handleToggleAlert = (type: CheckAlertType) => {
    onSelectionChange(type);
  };

  return (
    <div className={styles.column}>
      <div className={styles.sectionHeader}>
        <Label htmlFor={`header-${title}`} className={styles.headerLabel}>
          <Stack>
            <Text>{`${title}`}</Text>
          </Stack>
        </Label>
      </div>
      <div className={styles.list}>
        {alerts.map((alert: PredefinedAlertInterface) => (
          <AlertItem
            key={alert.type}
            alert={alert}
            selected={!!selectedAlerts?.[alert.type]?.isSelected}
            onSelectionChange={() => handleToggleAlert(alert.type)}
          />
        ))}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  column: css({
    fontSize: theme.typography.h6.fontSize,
    fontWeight: theme.typography.fontWeightLight,
    flex: 1,
  }),

  description: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    paddingTop: '3px',
  }),

  list: css({
    display: 'flex',
    flexDirection: 'column',
    minWidth: '250px',
    overflowY: 'auto',
  }),

  sectionHeader: css({
    display: 'flex',
    border: `1px solid ${theme.colors.border.weak}`,
    backgroundColor: `${theme.colors.background.secondary}`,
    padding: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    gap: theme.spacing(1),
    verticalAlign: 'middle',
    alignItems: 'center',
  }),

  headerLabel: css({
    fontWeight: theme.typography.fontWeightLight,
    fontSize: theme.typography.h5.fontSize,
    color: theme.colors.text.primary,
  }),
});
