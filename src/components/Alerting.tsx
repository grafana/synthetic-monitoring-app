import React, { FC, useState, useContext } from 'react';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { useStyles } from '@grafana/ui';
import { Collapse } from './Collapse';
import { AlertRule } from 'types';
import { InstanceContext } from './InstanceContext';

interface Props {
  alertRules: AlertRule[];
  editing: boolean;
  checkId?: number;
}

const getStyles = (theme: GrafanaTheme) => ({
  subheader: css`
    margin-top: ${theme.spacing.md};
  `,
  link: css`
    text-decoration: underline;
  `,
  container: css`
    background: #202226;
    padding: ${theme.spacing.md};
    display: flex;
    flex-direction: column;
    margin-bottom: ${theme.spacing.md};
  `,
  icon: css`
    margin-right: ${theme.spacing.xs};
  `,
  inputWrapper: css`
    margin-bottom: ${theme.spacing.sm};
  `,
  numberInput: css`
    max-width: 72px;
    margin: 0 ${theme.spacing.sm};
  `,
  horizontallyAligned: css`
    display: flex;
    align-items: center;
  `,
  horizontalFlexRow: css`
    display: flex;
    align-items: center;
  `,
  text: css`
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.formLabel};
  `,
  select: css`
    max-width: 200px;
  `,
  severityContainer: css`
    margin-bottom: ${theme.spacing.md};
  `,
  promql: css`
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    color: ${theme.colors.textWeak};
    font-size: ${theme.typography.size.md};
    display: block;
    width: 100%;
  `,
  promqlSection: css`
    margin-bottom: ${theme.spacing.md};
  `,
  deleteButton: css`
    display: flex;
    justify-content: flex-end;
  `,
  clearMarginBottom: css`
    margin-bottom: 0;
  `,
  halfWidth: css`
    width: 50%;
  `,
  unsetMaxWidth: css`
    max-width: unset;
  `,
});

export const Alerting: FC<Props> = ({ alertRules, editing, checkId }) => {
  const [showAlerting, setShowAlerting] = useState(false);
  const { instance } = useContext(InstanceContext);
  const styles = useStyles(getStyles);
  const alertingUiUrl = `a/grafana-alerting-ui-app/?tab=rules&rulessource=${instance.metrics?.name}`;

  // if (!instance.alertRuler) {
  //   return (
  //     <Collapse label="Alerting" onToggle={() => setShowAlerting(!showAlerting)} isOpen={showAlerting} collapsible>
  //       <div className={styles.container}>
  //         <p>
  //           <Icon className={styles.icon} name="exclamation-triangle" />
  //           Synthetic Monitoring uses &nbsp;
  //           <a href="https://grafana.com/docs/grafana-cloud/alerts/grafana-cloud-alerting/" className={styles.link}>
  //             Grafana Cloud Alerting
  //           </a>
  //           , which is not accessible for Grafana instances running on-prem. Alert rules can be added to new or existing
  //           checks in &nbsp;
  //           <a href="https://grafana.com" className={styles.link}>
  //             Grafana Cloud.
  //           </a>
  //         </p>
  //       </div>
  //     </Collapse>
  //   );
  // }

  if (alertRules.length && editing && instance.alertRuler) {
    return (
      <Collapse label="Alerting" onToggle={() => setShowAlerting(!showAlerting)} isOpen={showAlerting} collapsible>
        <div className={styles.container}>
          <p>
            {alertRules.length} alert{alertRules.length > 1 ? 's are' : ' is'} tied to this check. Edit this check's
            alerts in the <code>syntheticmonitoring &gt; {checkId}</code> section of{' '}
            <a href={alertingUiUrl} className={styles.link}>
              Grafana Cloud Alerting
            </a>
          </p>
        </div>
      </Collapse>
    );
  }
  return null;
};
