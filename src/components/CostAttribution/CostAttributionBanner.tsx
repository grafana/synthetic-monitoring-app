import React, { useEffect, useRef } from 'react';
import { Alert, LinkButton, Stack } from '@grafana/ui';
import {
  trackCmabLinkClicked,
  trackSetupBannerDismissed,
  trackSetupBannerShown,
} from 'features/tracking/costAttributionEvents';
import { useLocalStorage } from 'usehooks-ts';

import { useTenantCostAttributionLabels } from 'data/useTenantCostAttributionLabels';
import { DocsLink } from 'components/DocsLink/DocsLink';

import { CAL_BANNER_DISMISSED_KEY, CMAB_SETUP_DOCS_URL, CMAB_URLS } from './CostAttribution.constants';

interface CostAttributionBannerProps {
  /** Reported with the shown event so we can see how check volume affects take-up. */
  checkCount: number;
}

export const CostAttributionBanner = ({ checkCount }: CostAttributionBannerProps) => {
  const [dismissed, setDismissed] = useLocalStorage<boolean>(CAL_BANNER_DISMISSED_KEY, false);
  const { data: calData } = useTenantCostAttributionLabels();
  const shownTrackedRef = useRef(false);

  const show = calData && calData.names.length === 0 && !dismissed;

  useEffect(() => {
    if (show && !shownTrackedRef.current) {
      shownTrackedRef.current = true;
      trackSetupBannerShown({ checkCount });
    }
  }, [show, checkCount]);

  if (!show) {
    return null;
  }

  return (
    <Alert
      title="Attribute check costs to teams and services"
      severity="info"
      onRemove={() => {
        setDismissed(true);
        trackSetupBannerDismissed();
      }}
    >
      <Stack gap={1} direction="column" alignItems="flex-start">
        <p>
          Your checks generate executions and active series that count towards your Grafana Cloud bill. With{' '}
          <DocsLink href={CMAB_SETUP_DOCS_URL} source="check_list_cost_attribution_banner">
            cost attribution labels
          </DocsLink>{' '}
          you can break that spend down by team, service, or any dimension that matters to your organization, and track
          it in the Cost Management and Billing app.
        </p>
        <LinkButton
          size="sm"
          href={CMAB_URLS.settings}
          onClick={() => trackCmabLinkClicked({ source: 'check_list_banner' })}
        >
          Set up cost attribution
        </LinkButton>
      </Stack>
    </Alert>
  );
};
