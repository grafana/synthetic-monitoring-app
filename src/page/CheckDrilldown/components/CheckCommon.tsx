import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckExplorer } from 'page/CheckDrilldown/components/CheckExplorer';
import { InfoCheck } from 'page/CheckDrilldown/components/InfoCheck';

export const CheckCommon = () => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <div className={styles.explorerContainer}>
        <CheckExplorer />
      </div>
      <InfoCheck />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: grid;
      grid-template-columns: 2fr 500px;
      gap: ${theme.spacing(2)};
      margin: ${theme.spacing(2, 0)};
    `,
    explorerContainer: css`
      max-width: 100%;
      overflow: hidden;
      min-width: 0; /* This is crucial for flex/grid children */
    `,
  };
};
