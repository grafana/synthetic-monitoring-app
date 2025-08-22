import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { IconButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';

export function TimepointListErrorButton() {
  const styles = useStyles2(getStyles);
  const { handleRefetch } = useTimepointExplorerContext();

  return (
    <div className={styles.container}>
      <IconButton
        className={styles.button}
        tooltip={`There was an error fetching data. Click to retry.`}
        name="sync-slash"
        onClick={handleRefetch}
      />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  button: css`
    color: ${theme.colors.error.text};
    margin: 0;
  `,
  container: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(1)};
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.radius.default};
    background-color: ${theme.colors.background.secondary};
  `,
});
