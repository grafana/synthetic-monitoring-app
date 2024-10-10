import React, { type ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, useStyles2 } from '@grafana/ui';
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
  const styles = useStyles2(getStyles);

  return (
    <Alert severity="error" title={title} className={styles.container}>
      <div className={styles.content}>
        <div>{content}</div>

        <Button variant="secondary" onClick={onClick}>
          {buttonText}
        </Button>
      </div>
    </Alert>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    maxWidth: `1648px`,
  }),
  content: css({
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
  }),
});
