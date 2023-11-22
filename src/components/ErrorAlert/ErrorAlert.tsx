import React, { type ReactNode } from 'react';
import { Alert, Button, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

const defaultTitle = 'Something went wrong';
const defaultContent =
  'An error has occurred, this can be caused by either poor connectivity or an error with our servers. If you have an ad blocking extension installed in your browser, try disabling it and reload the page.';

interface ErrorAlertProps {
  buttonText: string;
  onClick: () => void;
  title?: string;
  content?: ReactNode | string;
}
export const ErrorAlert = ({
  buttonText,
  content = defaultContent,
  onClick,
  title = defaultTitle,
}: ErrorAlertProps) => {
  const theme = useTheme2();

  return (
    <Alert severity="error" title={title}>
      <div
        className={css({
          display: 'flex',
          justifyContent: 'space-between',
          gap: theme.spacing(2),
        })}
      >
        <div>{content}</div>

        <Button variant="secondary" onClick={onClick}>
          {buttonText}
        </Button>
      </div>
    </Alert>
  );
};
