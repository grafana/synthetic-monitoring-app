import React from 'react';
import { Stack, Tag } from '@grafana/ui';
import { LOG_LABELS_COMMON, LOG_LABELS_SM } from 'features/parseCheckLogs/checkLogs.constants.labels';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { LogWithDuration } from 'scenes/components/LogsRenderer/LogsTimeline.utils';

export const UniqueLogLabels = ({ log }: { log: LogWithDuration }) => {
  const labels = uniqueLabels(log);

  return (
    <Stack direction="row" gap={1} alignItems="center" wrap="wrap">
      {labels.map((label) => (
        <Tag name={`${label}:${log.labels[label]}`} key={label} />
      ))}
    </Stack>
  );
};

function uniqueLabels(log: LogWithDuration) {
  const labels = Object.keys(log[LokiFieldNames.Labels]);

  const labelsFiltered = labels
    .filter((key) => !LOG_LABELS_COMMON.includes(key) && !LOG_LABELS_SM.includes(key))
    .filter((key) => key !== 'msg' && !key.includes(`_extracted`) && !key.includes(`label_`))
    .filter((key) => key !== 'time'); // seems redundant as it corresponds to the log timestamp

  return labelsFiltered;
}
