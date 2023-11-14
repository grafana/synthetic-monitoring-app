import React from 'react';
import { Spinner } from '@grafana/ui';
import { css } from '@emotion/css';

export const CenteredSpinner = () => {
  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      })}
    >
      <Spinner />
    </div>
  );
};
