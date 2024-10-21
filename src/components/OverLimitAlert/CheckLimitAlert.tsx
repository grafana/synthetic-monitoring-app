import React from 'react';
import { TextLink } from '@grafana/ui';

import { ROUTES } from 'types';
import { useLimits } from 'hooks/useLimits';
import { getRoute } from 'components/Routing.utils';
import { Ul } from 'components/Ul';

import { AlertContainer } from './AlertContainer';

export const CheckLimitAlert = () => {
  const { tenantLimits } = useLimits();

  return (
    <AlertContainer title="Check limit reached">
      {`You have reached your check limit of ${tenantLimits?.MaxChecks}. Your options are:`}
      <Ul>
        <li>
          <TextLink href="https://grafana.com/contact" external>
            Contact support to increase your limit
          </TextLink>
        </li>
        <li>
          Optimize usage by eliminating unnecessary <TextLink href={getRoute(ROUTES.Checks)}>checks</TextLink>
        </li>
      </Ul>
    </AlertContainer>
  );
};
