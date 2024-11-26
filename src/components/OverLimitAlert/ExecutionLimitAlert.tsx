import React from 'react';
import { TextLink } from '@grafana/ui';

import { ROUTES } from 'routing/types';
import { getRoute } from 'routing/utils';
import { FREE_EXECUTION_LIMIT } from 'hooks/useAtHgExecutionLimit';
import { Ul } from 'components/Ul';

import { AlertContainer } from './AlertContainer';

export const ExecutionLimitAlert = () => {
  return (
    <AlertContainer title="Execution limit reached">
      {`You have reached your monthly execution limit of ${Intl.NumberFormat().format(
        FREE_EXECUTION_LIMIT
      )}. Your options are:`}
      <Ul>
        <li>
          <TextLink href="https://grafana.com/profile/org/subscription" external>
            Upgrade your plan
          </TextLink>
        </li>
        <li>
          Optimize usage by eliminating unnecessary <TextLink href={getRoute(ROUTES.Checks)}>checks</TextLink> and
          decreasing execution frequency or reducing probes on existing checks
        </li>
      </Ul>
    </AlertContainer>
  );
};
