import React from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType } from 'types';
import { SecretsManagementUI } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/SecretsManagementUI';

export const SECRETS_CHECK_COMPATIBILITY: CheckType[] = [CheckType.Browser, CheckType.Scripted];

export function SecretsPanel() {
  const theme = useTheme2();

  return (
    <div
      className={css`
        padding: ${theme.spacing(2)};
      `}
    >
      <SecretsManagementUI />
    </div>
  );
}
