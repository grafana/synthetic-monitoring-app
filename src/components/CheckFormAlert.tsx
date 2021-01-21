import React, { FC, useState, useContext } from 'react';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { Select, useStyles } from '@grafana/ui';
import { Collapse } from './Collapse';
import { InstanceContext } from './InstanceContext';
import { Controller } from 'react-hook-form';
import { ALERT_SENSITIVITY_OPTIONS } from './constants';

interface Props {
  checkId?: number;
}

const getStyles = (theme: GrafanaTheme) => ({
  container: css`
    background: #202226;
    padding: ${theme.spacing.md};
    display: flex;
    flex-direction: column;
    margin-bottom: ${theme.spacing.md};
  `,
});

export const CheckFormAlert: FC<Props> = () => {
  const [showAlerting, setShowAlerting] = useState(false);
  const { instance } = useContext(InstanceContext);
  const styles = useStyles(getStyles);
  const alertingUiUrl = `a/grafana-alerting-ui-app/?tab=rules&rulessource=${instance.metrics?.name}`;

  return (
    <Collapse label="Alerting" onToggle={() => setShowAlerting(!showAlerting)} isOpen={showAlerting} collapsible>
      <div className={styles.container}>
        <Controller name="alertSensitivity" as={Select} options={ALERT_SENSITIVITY_OPTIONS} />
      </div>
    </Collapse>
  );
};
