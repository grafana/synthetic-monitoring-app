import React, { useEffect, useRef } from 'react';
import { Alert, LinkButton, Stack, TextLink } from '@grafana/ui';
import { trackCmabLinkClicked, trackSetupBannerDismissed, trackSetupBannerShown } from 'features/tracking/costAttributionEvents';
import { useLocalStorage } from 'usehooks-ts';

import {
  CAL_BANNER_DISMISSED_KEY,
  CMAB_SETUP_DOCS_URL,
  CMAB_URLS,
  MIN_CHECKS_FOR_CAL_BANNER,
} from './CostAttribution.constants';
import { useCostAttributionSetupStatus } from './CostAttribution.hooks';

interface CostAttributionBannerProps {
  checkCount: number;
}

export const CostAttributionBanner = ({ checkCount }: CostAttributionBannerProps) => {
  const [dismissed, setDismissed] = useLocalStorage<boolean>(CAL_BANNER_DISMISSED_KEY, false);
  const { needsSetup } = useCostAttributionSetupStatus();
  const shownTrackedRef = useRef(false);

  const show = needsSetup && !dismissed && checkCount >= MIN_CHECKS_FOR_CAL_BANNER;

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
          <TextLink href={CMAB_SETUP_DOCS_URL} external={true}>
            cost attribution labels
          </TextLink>{' '}
          you can break that spend down by team, service, or any dimension that matters to your organization, and
          track it in the Cost Management and Billing app.
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
