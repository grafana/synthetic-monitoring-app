import React, { useCallback, useState } from 'react';
import { AnnotationQuery, GrafanaTheme2 } from '@grafana/data';
import { RadioButtonGroup, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, FeatureName } from 'types';
import { FeatureFlag } from 'components/FeatureFlag';
import { Feedback } from 'components/Feedback';
import { ExecutionExplorerToolbar } from 'scenes/components/TimepointExplorer/ExecutionExplorerToolbar';
import { TIMEPOINT_EXPLORER_VIEW_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  TimepointExplorerProvider,
  useTimepointExplorerContext,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { ExecutionResultFilter } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointExplorerVisibleOverview } from 'scenes/components/TimepointExplorer/TimepointExplorerVisibleOverview';
import { TimepointList } from 'scenes/components/TimepointExplorer/TimepointList';
import { TimepointMinimap } from 'scenes/components/TimepointExplorer/TimepointMinimap';
import { TimepointViewer } from 'scenes/components/TimepointExplorer/TimepointViewer';

interface TimepointExplorerProps {
  check: Check;
  resultFilter?: ExecutionResultFilter;
  onResultFilterChange?: (filter: ExecutionResultFilter) => void;
  annotations?: AnnotationQuery[];
}

export const TimepointExplorer = ({
  check,
  resultFilter,
  onResultFilterChange,
  annotations = [],
}: TimepointExplorerProps) => {
  const [internalResultFilter, setInternalResultFilter] = useState<ExecutionResultFilter>('all');
  const activeResultFilter = resultFilter ?? internalResultFilter;
  const handleResultFilterChange = useCallback(
    (filter: ExecutionResultFilter) => {
      if (resultFilter === undefined) {
        setInternalResultFilter(filter);
      }
      onResultFilterChange?.(filter);
    },
    [onResultFilterChange, resultFilter]
  );

  return (
    <FeatureFlag name={FeatureName.TimepointExplorer}>
      {({ isEnabled }) =>
        isEnabled ? (
          <TimepointExplorerProvider
            check={check}
            resultFilter={activeResultFilter}
            onResultFilterChange={handleResultFilterChange}
          >
            <TimepointExplorerInternal annotations={annotations} />
          </TimepointExplorerProvider>
        ) : (
          <ExecutionExplorerToolbar
            annotations={annotations}
            onResultFilterChange={handleResultFilterChange}
            resultFilter={activeResultFilter}
          />
        )
      }
    </FeatureFlag>
  );
};

const CONTAINER_NAME = 'timepoint-explorer';

const TimepointExplorerInternal = ({ annotations }: { annotations: AnnotationQuery[] }) => {
  const { viewMode, handleViewModeChange, resultFilter, handleResultFilterChange } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <Stack direction={`column`} gap={2}>
        <div className={styles.header}>
          <TimepointExplorerVisibleOverview />
          <div className={styles.actions}>
            <Feedback
              feature="timepoint-explorer"
              about={{
                text: `New feature!`,
                link: `https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/analyze-results/visualize-check-execution/`,
              }}
            />
            <div>
              <RadioButtonGroup
                options={TIMEPOINT_EXPLORER_VIEW_OPTIONS}
                value={viewMode}
                onChange={handleViewModeChange}
              />
            </div>
          </div>
        </div>

        <ExecutionExplorerToolbar
          annotations={annotations}
          onResultFilterChange={handleResultFilterChange}
          resultFilter={resultFilter}
        />

        <Stack direction="column" gap={2}>
          <TimepointMinimap />
          <TimepointList />
          <TimepointViewer />
        </Stack>
      </Stack>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const breakpoint = theme.breakpoints.values.md;
  const query = `(max-width: ${breakpoint}px)`;
  const containerQuery = `@container ${CONTAINER_NAME} ${query}`;

  return {
    container: css`
      padding-top: ${theme.spacing(2)};
      container-name: ${CONTAINER_NAME};
      container-type: layout;
    `,
    header: css`
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      gap: ${theme.spacing(2)};

      ${containerQuery} {
        flex-direction: column;
        align-items: start;

        > :first-child {
          order: 1;
        }
      }
    `,
    actions: css`
      display: flex;
      flex-direction: row;
      gap: ${theme.spacing(1)};
      justify-content: space-between;

      ${containerQuery} {
        width: 100%;
      }
    `,
  };
};
