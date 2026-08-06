import React, { ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { TextLink, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackCmabLinkClicked } from 'features/tracking/costAttributionEvents';

import { CMAB_URLS } from './CostAttribution.constants';
import { useShowCostAttributionSetupNudge } from './CostAttribution.hooks';

export type UsageMetric = 'active_series' | 'executions_per_month';

interface CostAttributionUsageTooltipProps {
  source: 'check_list' | 'check_form';
  metric: UsageMetric;
  children: ReactNode;
}

// Wraps usage figures ("active series", "executions per month") with a tooltip nudging
// towards cost attribution — these figures are cost proxies, so someone reading them is
// likely interested in what their checks cost. Renders children untouched when the
// tenant already has cost attribution labels (or the feature is off).
export const CostAttributionUsageTooltip = ({ source, metric, children }: CostAttributionUsageTooltipProps) => {
  const styles = useStyles2(getStyles);
  const showNudge = useShowCostAttributionSetupNudge();

  if (!showNudge) {
    return <>{children}</>;
  }

  return (
    <Tooltip
      interactive
      placement="top"
      content={
        <>
          This contributes to your Grafana Cloud usage.{' '}
          <TextLink
            href={CMAB_URLS.settings}
            external={true}
            variant="bodySmall"
            onClick={() => trackCmabLinkClicked({ source: `${source}_usage_tooltip`, metric })}
          >
            Attribute check costs to teams and services
          </TextLink>
        </>
      }
    >
      <span className={styles.hintTarget}>{children}</span>
    </Tooltip>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    hintTarget: css`
      text-decoration: underline dotted ${theme.colors.text.secondary};
      text-underline-offset: 3px;
      cursor: help;
    `,
  };
}
