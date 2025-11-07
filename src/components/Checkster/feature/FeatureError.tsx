import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { getErrorMessage } from 'utils';

import { GrotSad } from '../components/ui/GrotSad';

export function FeatureError({ onReset, error, feature }: { error: Error; onReset: () => void; feature: string }) {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.root}>
      <div className={styles.grotSadContainer}>
        <GrotSad />
      </div>
      <div className={styles.messageContainer}>
        <Text variant="body" weight="bold">
          An error occurred while trying to display this content.
        </Text>
        <Text element="p" color="secondary">
          You can try to reset the error and try again. If the problem persists{' '}
          <TextLink href="https://grafana.com/contact" external>
            contact support
          </TextLink>
          .<br />
        </Text>
      </div>
      <Button onClick={onReset}>Ok, reset error</Button>
      <div>
        <Text color="error" element="p" variant="bodySmall">
          <strong>{feature}Error:</strong> {getErrorMessage(error)}
        </Text>
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    root: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${theme.spacing(2)};
      margin-top: ${theme.spacing(2)};
    `,
    grotSadContainer: css`
      max-width: ${theme.spacing(20)};
    `,
    messageContainer: css`
      text-align: center;
    `,
  };
}
