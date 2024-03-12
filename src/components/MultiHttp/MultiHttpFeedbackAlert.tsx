import React from 'react';
import { Alert, useStyles2 } from '@grafana/ui';

import { getMultiHttpFormStyles } from './MultiHttpSettingsForm.styles';

export const MultiHttpFeedbackAlert = () => {
  const styles = useStyles2(getMultiHttpFormStyles);

  return (
    <Alert severity="info" title="MultiHTTP checks are in public preview">
      We are actively seeking feedback! Please share your thoughts in&nbsp;
      <a
        href="https://github.com/grafana/synthetic-monitoring-app/issues"
        target="_blank"
        rel="noopenner noreferrer"
        className={styles.link}
      >
        GitHub
      </a>
      &nbsp;or in our&nbsp;
      <a
        href="https://community.grafana.com/c/grafanacloud/34"
        rel="noopenner noreferrer"
        target="_blank"
        className={styles.link}
      >
        community forum
      </a>
      .
    </Alert>
  );
};
