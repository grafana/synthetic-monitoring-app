import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, Tag, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { TraceLink } from 'scenes/components/LogsRenderer/TraceLink';
import { TRACE_LABEL_NAMES } from 'scenes/components/LogsRenderer/TraceLink.constants';
import { uniqueLabels } from 'scenes/components/LogsRenderer/UniqueLogLabels.utils';

interface LabelRendererProps {
  labelName: string;
  labelValue: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  traceExists?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

const LABEL_RENDERER_MAP: Record<string, React.ComponentType<LabelRendererProps>> = Object.fromEntries(
  [...TRACE_LABEL_NAMES].map((name) => [name, TraceLink])
);

interface UniqueLogLabelsProps {
  log: ParsedLokiRecord<Record<string, string>, Record<string, string>>;
  expanded?: boolean;
  onToggle?: () => void;
  traceExists?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const UniqueLogLabels = ({
  log,
  expanded,
  onToggle,
  traceExists,
  isLoading,
  isError,
  onRetry,
}: UniqueLogLabelsProps) => {
  const labels = uniqueLabels(log);
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="row" gap={1} alignItems="center" wrap="wrap">
      {labels.map((label) => {
        const Renderer = LABEL_RENDERER_MAP[label];

        if (Renderer) {
          return (
            <Renderer
              key={label}
              labelName={label}
              labelValue={log.labels[label]}
              isExpanded={expanded}
              onToggle={onToggle}
              traceExists={traceExists}
              isLoading={isLoading}
              isError={isError}
              onRetry={onRetry}
            />
          );
        }

        return <Tag name={`${label}=${log.labels[label]}`} key={label} className={styles.tag} />;
      })}
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  tag: css`
    white-space: break-spaces;
    overflow-wrap: anywhere;
  `,
});
