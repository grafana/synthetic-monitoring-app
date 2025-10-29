import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Preformatted } from 'components/Preformatted';

interface LogDetailsProps {
  content: string | object;
}
export function LogDetails({ content }: LogDetailsProps) {
  const styles = useStyles2(getStyles);
  return (
    <Preformatted>
      {content && typeof content === 'object'
        ? Object.entries(content).map(([key, value]) => {
            return (
              <div key={key}>
                {key}: <span className={styles.secondaryText}>{value}</span>
              </div>
            );
          })
        : content}
    </Preformatted>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    secondaryText: css`
      color: ${theme.colors.text.secondary};
    `,
  };
}
