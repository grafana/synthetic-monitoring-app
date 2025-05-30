import React from 'react';
import { TextLink } from '@grafana/ui';

import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { useLimits } from 'hooks/useLimits';
import { Ul } from 'components/Ul';

import { AlertContainer } from './AlertContainer';

export const ScriptedCheckLimitAlert = () => {
  const { tenantLimits } = useLimits();

  return (
    <AlertContainer title="Check limit reached">
      {`You have reached your Scripted and Multi Step check limit of ${tenantLimits?.MaxScriptedChecks}. Your options are:`}
      <Ul>
        <li>
          <TextLink href="https://grafana.com/contact" external>
            Contact support to increase your limit
          </TextLink>
        </li>
        <li>
          {/* TODO: improve the filter so we can link to both multiHttp and Scripted checks */}
          Optimize usage by eliminating unnecessary{' '}
          <TextLink href={getRoute(AppRoutes.Checks)}>Scripted and Multi Step checks</TextLink>
        </li>
      </Ul>
    </AlertContainer>
  );
};
