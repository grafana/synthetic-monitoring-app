import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { PROBES_TEST_ID } from 'test/dataTestIds';

import { ProbeWithMetadata } from 'types';

export function ProbeStatus({ probe }: { probe: ProbeWithMetadata }) {
  const styles = useStyles2((theme) => getStyles(theme, probe));

  return (
    <Tooltip
      content={
        <div data-testid={PROBES_TEST_ID.cards.statusTooltip}>
          Probe {probe.displayName} is <span className={styles.statusText}>{probe.online ? 'online' : 'offline'}</span>
        </div>
      }
    >
      <div data-testid={PROBES_TEST_ID.cards.status} className={styles.container} />
    </Tooltip>
  );
}

function getStyles(theme: GrafanaTheme2, probe: ProbeWithMetadata) {
  return {
    container: css({
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: probe.online ? theme.colors.success.text : theme.colors.error.text,
      marginRight: theme.spacing(0.75),
    }),
    statusText: css({
      color: probe.online ? theme.colors.success.text : theme.colors.error.text,
    }),
  };
}
