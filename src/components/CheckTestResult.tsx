import React, { useState } from 'react';
import { DataFrame, dateTime, GrafanaTheme2, LoadingState } from '@grafana/data';
import { PanelRenderer } from '@grafana/runtime';
import { Badge, Collapse, Icon, Spinner, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface Props {
  probeName: string;
  success: boolean;
  loading: boolean;
  logs: DataFrame;
}

const LOGS_HEIGHT = 300;

export function CheckTestResult({ probeName, success, loading, logs }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(0);
  const styles = useStyles2(getStyles);
  const header = (
    <div className={styles.header}>
      {probeName}
      {!loading ? (
        <div className={styles.headerBadges}>
          <Badge
            text={success ? 'Success' : 'Fail'}
            icon={success ? 'check-circle' : 'exclamation-circle'}
            color={success ? 'green' : 'red'}
          />
          <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
        </div>
      ) : (
        <Spinner />
      )}
    </div>
  );

  return (
    <Collapse
      label={header}
      isOpen={isOpen}
      onToggle={(isOpen) => {
        if (!loading) {
          setIsOpen(isOpen);
        }
      }}
    >
      {!loading && logs ? (
        <div
          ref={(el) => {
            if (el) {
              setWidth(el.clientWidth);
            }
          }}
          style={{
            height: `${LOGS_HEIGHT}px`,
          }}
        >
          <PanelRenderer
            title="Logs"
            pluginId="logs"
            width={width}
            height={LOGS_HEIGHT}
            data={{
              state: LoadingState.Done,
              series: [logs],
              timeRange: {
                from: dateTime(),
                to: dateTime(),
                raw: {
                  from: 'now',
                  to: 'now',
                },
              },
            }}
            options={{
              detailsMode: `inline`,
            }}
          />
        </div>
      ) : (
        <Spinner />
      )}
    </Collapse>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  header: css`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  `,
  headerBadges: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  logLine: css`
    margin-bottom: ${theme.spacing(1)};
    display: flex;
    flex-direction: row;
  `,
  logLevelIndicator: css`
    width: 3px;
    min-width: 3px;
    max-width: 3px;
    margin-right: ${theme.spacing(1)};
  `,
  logLevelNone: css`
    background-color: ${theme.colors.info.main};
  `,
  logLevelInfo: css`
    background-color: ${theme.colors.success.main};
  `,
  logLevelError: css`
    background-color: ${theme.colors.error.main};
  `,
});
