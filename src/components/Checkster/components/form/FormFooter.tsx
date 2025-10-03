import React from 'react';
import { Button, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

export function FormFooter() {
  const theme = useTheme2();
  return (
    <div
      className={css`
        padding: ${theme.spacing(2)};
      `}
    >
      <Button type="button">Previous</Button>
      <Button type="button">Next</Button>
      <Button type="submit">Submit</Button>
    </div>
  );
}
