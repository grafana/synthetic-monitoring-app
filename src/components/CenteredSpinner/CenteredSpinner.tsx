import React from 'react';
import { Spinner } from '@grafana/ui';
import { css } from '@emotion/css';

import { DataTestIds } from '../../test/dataTestIds';

export const CenteredSpinner = (props: { 'aria-label'?: string }) => {
  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      })}
      aria-hidden="false"
      aria-label={props['aria-label'] ?? 'Loading'}
      data-testid={DataTestIds.CENTERED_SPINNER}
    >
      <Spinner />
    </div>
  );
};
