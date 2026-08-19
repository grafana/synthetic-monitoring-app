import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackCmabLinkClicked } from 'features/tracking/costAttributionEvents';

import { CMAB_URLS } from './CostAttribution.constants';

export const CostAttributionSetupHint = () => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.hint} data-testid="cost-attribution-setup-hint">
      <Stack gap={1} alignItems="flex-start">
        <Icon name="graph-bar" className={styles.icon} />
        <Stack direction="column" gap={0.5} alignItems="flex-start">
          <Text weight="medium">Want to see what your checks cost per team or service?</Text>
          <div>
            Set up cost attribution labels and they appear here on every check and your spend is broken down in the Cost
            Management and Billing app.{' '}
            <TextLink
              href={CMAB_URLS.settings}
              external={true}
              onClick={() => trackCmabLinkClicked({ source: 'check_form_labels' })}
              variant="bodySmall"
            >
              Set up cost attribution
            </TextLink>
          </div>
        </Stack>
      </Stack>
    </div>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    hint: css`
      background-color: ${theme.colors.background.secondary};
      border-radius: ${theme.shape.radius.default};
      padding: ${theme.spacing(2)};
      font-size: ${theme.typography.bodySmall.fontSize};
    `,
    icon: css`
      color: ${theme.colors.text.secondary};
    `,
  };
}
