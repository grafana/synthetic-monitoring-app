import React from 'react';
import { Spinner } from '@grafana/ui';
import { css } from '@emotion/css';

import { UI_TEST_ID } from '../../test/dataTestIds';;

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
      data-testid={UI_TEST_ID.centeredSpinner}
    >
      <Spinner />
    </div>
  );
};
