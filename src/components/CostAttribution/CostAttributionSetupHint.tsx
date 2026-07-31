import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Stack, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackCmabLinkClicked } from 'features/tracking/costAttributionEvents';

import { CMAB_URLS } from './CostAttribution.constants';

// Shown in the labels step when the CALs feature is enabled but the tenant hasn't
// configured any cost attribution labels yet. Users at this step are actively thinking
// about labelling, so it is a high-intent moment — but setup happens outside the check
// form and needs the "Cost attribution admin" role, so the copy warns them and the link
// opens in a new tab to preserve their unsaved check. Purely presentational: the parent
// decides visibility (feature flag + no CAL names configured).
export const CostAttributionSetupHint = () => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.hint} data-testid="cost-attribution-setup-hint">
      <Stack gap={1} alignItems="flex-start">
        <Icon name="graph-bar" className={styles.icon} />
        <div>
          <div className={styles.title}>Want to see what your checks cost per team or service?</div>
          <div>
            Once an admin sets up cost attribution labels, they appear here on every check and your spend is broken
            down in the Cost Management and Billing app.{' '}
            <TextLink
              href={CMAB_URLS.settings}
              external={true}
              onClick={() => trackCmabLinkClicked({ source: 'check_form_labels' })}
            >
              Set up cost attribution
            </TextLink>{' '}
            (opens in a new tab so you won&apos;t lose this check; requires an admin role).
          </div>
        </div>
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
      margin-top: ${theme.spacing(0.25)};
      color: ${theme.colors.text.secondary};
    `,
    title: css`
      font-weight: ${theme.typography.fontWeightMedium};
      margin-bottom: ${theme.spacing(0.5)};
    `,
  };
}
