import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, Tag, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { LOG_LABELS_COMMON, LOG_LABELS_SM } from 'features/parseCheckLogs/checkLogs.constants.labels';

import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';

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

function uniqueLabels(log: ParsedLokiRecord<Record<string, string>, Record<string, string>>) {
  const labels = Object.keys(log[LokiFieldNames.Labels]);

  const labelsFiltered = labels
    .filter((key) => !LOG_LABELS_COMMON.includes(key) && !LOG_LABELS_SM.includes(key))
    .filter((key) => key !== 'msg' && !key.includes(`_extracted`) && !key.includes(`label_`))
    .filter((key) => key !== 'time'); // seems redundant as it corresponds to the log timestamp

  return labelsFiltered;
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    tag: css`
      white-space: break-spaces;
      overflow-wrap: anywhere;
    `,
  };
};
