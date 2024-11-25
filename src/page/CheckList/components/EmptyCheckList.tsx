import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ROUTES } from 'types';
import { useNavigation } from 'hooks/useNavigation';

export const EmptyCheckList = () => {
  const navigate = useNavigation();
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.emptyCard}>
      <span className={styles.text}>
        This account does not currently have any checks configured. Click the New check button to start monitoring your
        services with Grafana Cloud, or{' '}
        <a href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/" className={styles.link}>
          check out the Synthetic Monitoring docs.
        </a>
      </span>
      <Button size="md" onClick={() => navigate(ROUTES.ChooseCheckGroup)}>
        New check
      </Button>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  emptyCard: css`
    background-color: ${theme.colors.background.secondary};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 100px;
  `,
  text: css`
    margin-bottom: ${theme.spacing(4)};
    text-align: center;
  `,
  link: css`
    text-decoration: underline;
  `,
});
