import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, LinkButton, Stack } from '@grafana/ui';
import {
  trackCmabLinkClicked,
  trackSetupBannerDismissed,
  trackSetupBannerShown,
} from 'features/tracking/costAttributionEvents';
import { useLocalStorage } from 'usehooks-ts';

import { DocsLink } from 'components/DocsLink/DocsLink';

import { CAL_BANNER_DISMISSED_KEY, CMAB_SETUP_DOCS_URL, CMAB_URLS } from './CostAttribution.constants';
import { useShowCostAttributionSetupNudge } from './CostAttribution.hooks';

interface CostAttributionBannerProps {
  /** Reported with the shown event so we can see how check volume affects take-up. */
  checkCount: number;
}

export const CostAttributionBanner = ({ checkCount }: CostAttributionBannerProps) => {
  const [dismissed, setDismissed] = useLocalStorage<boolean>(CAL_BANNER_DISMISSED_KEY, false);
  const [localDismissed, setLocalDismissed] = useState(dismissed);
  const showNudge = useShowCostAttributionSetupNudge();
  const shownTrackedRef = useRef(false);

  const show = showNudge && !localDismissed;

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
        setLocalDismissed(true);
        trackSetupBannerDismissed({ permanent: false });
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
        <Stack direction="row" gap={1}>
          <LinkButton
            size="sm"
            href={CMAB_URLS.settings}
            onClick={() => trackCmabLinkClicked({ source: 'check_list_banner' })}
          >
            Set up cost attribution
          </LinkButton>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setDismissed(true);
              setLocalDismissed(true);
              trackSetupBannerDismissed({ permanent: true });
            }}
          >
            Understood, don&apos;t show again
          </Button>
        </Stack>
      </Stack>
    </Alert>
  );
};
