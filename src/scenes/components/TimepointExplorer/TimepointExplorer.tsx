import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { RadioButtonGroup, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, FeatureName } from 'types';
import { FeatureFlag } from 'components/FeatureFlag';
import { Feedback } from 'components/Feedback';
import { TIMEPOINT_EXPLORER_VIEW_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  TimepointExplorerProvider,
  useTimepointExplorerContext,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { TimepointExplorerVisibleOverview } from 'scenes/components/TimepointExplorer/TimepointExplorerVisibleOverview';
import { TimepointList } from 'scenes/components/TimepointExplorer/TimepointList';
import { TimepointMinimap } from 'scenes/components/TimepointExplorer/TimepointMinimap';
import { TimepointViewer } from 'scenes/components/TimepointExplorer/TimepointViewer';

interface TimepointExplorerProps {
  check: Check;
}

export const TimepointExplorer = ({ check }: TimepointExplorerProps) => {
  return (
    <FeatureFlag name={FeatureName.TimepointExplorer}>
      {({ isEnabled }) =>
        isEnabled ? (
          <TimepointExplorerProvider check={check}>
            <TimepointExplorerInternal />
          </TimepointExplorerProvider>
        ) : null
      }
    </FeatureFlag>
  );
};

const CONTAINER_NAME = 'timepoint-explorer';

const TimepointExplorerInternal = () => {
  const { viewMode, handleViewModeChange } = useTimepointExplorerContext();
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
      container-type: inline-size;
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
