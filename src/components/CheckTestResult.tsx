import { DateTime, GrafanaTheme2 } from '@grafana/data';
import { Badge, Collapse, Icon, Spinner, useStyles2 } from '@grafana/ui';
import React, { useState } from 'react';
import { css, cx } from '@emotion/css';

interface Props {
  probeName: string;
  success: boolean;
  loading: boolean;
  start: DateTime;
  end: DateTime;
  logs: any[];
}

export function CheckTestResult({ probeName, success, loading, logs, start, end }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const styles = useStyles2(getStyles);
  const header = (
    <div className={styles.header}>
      {probeName}
      {!loading ? (
        <div className={styles.headerBadges}>
          <Badge
            text={success ? 'Success' : 'Fail'}
            icon={success ? 'check-circle' : 'x'}
            color={success ? 'green' : 'red'}
          />
          <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
        </div>
      ) : (
        <Spinner />
      )}
    </div>
  );

  // logsDF.fields.unshift({
  //   name: 'Line',
  //   type: FieldType.string,
  //   values: new ArrayVector(logs?.map((log) => log.msg)),
  //   config: {},
  // });
  // const range: TimeRange = {
  //   from: start,
  //   to: end,
  //   raw: {
  //     from: start,
  //     to: end,
  //   },
  // };
  return (
    <Collapse label={header} isOpen={isOpen} onToggle={(isOpen) => setIsOpen(isOpen)}>
      {!loading && logs ? (
        <div>
          {logs.map((log, index) => {
            return (
              <div className={styles.logLine} key={index}>
                <div
                  className={cx(styles.logLevelIndicator, {
                    [styles.logLevelNone]: log.level !== 'info' || log.level !== 'error',
                    [styles.logLevelInfo]: log.level === 'info',
                    [styles.logLevelError]: log.level === 'error',
                  })}
                />
                <div>
                  {Object.keys(log).map((logLabel, index) => {
                    return (
                      <span key={index}>
                        <strong>{logLabel}:</strong>&nbsp;{log[logLabel]}{' '}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
