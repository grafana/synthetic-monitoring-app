import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, Tag, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { uniqueLabels } from 'scenes/components/LogsRenderer/UniqueLogLabels.utils';

export const UniqueLogLabels = ({ log }: { log: ParsedLokiRecord<Record<string, string>, Record<string, string>> }) => {
  const labels = uniqueLabels(log);
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="row" gap={1} alignItems="center" wrap="wrap">
      {labels.map((label) => (
        <Tag name={`${label}=${log.labels[label]}`} key={label} className={styles.tag} />
      ))}
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    tag: css`
      white-space: break-spaces;
      overflow-wrap: anywhere;
    `,
  };
};
