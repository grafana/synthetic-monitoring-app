import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, LoadingBar, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { MSG_STRINGS_COMMON } from 'features/parseCheckLogs/checkLogs.constants.msgs';
import { decode } from 'js-base64';

import { CheckLogs, PerCheckLogs } from 'features/parseCheckLogs/checkLogs.types';
import { Check } from 'types';
import { CodeEditor } from 'components/CodeEditor';
import { useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';
import { pluralize } from 'page/CheckDrilldown/components/InfoProbe';
import { useTimeRange } from 'page/CheckDrilldown/components/TimeRangeContext';
import { useCheckLogs } from 'page/CheckDrilldown/hooks/useCheckLogs';
import { getColor } from 'page/CheckDrilldown/utils/colors';

export const CheckAnalysis = () => {
  const styles = useStyles2(getStyles);
  const { timeRange } = useTimeRange();
  const { check } = useCheckDrilldown();
  const { data, isLoading } = useCheckLogs({
    check,
    timeRange,
    query: `{job=\`${check.job}\`, instance=\`${check.target}\`, probe_success=\`0\`} | logfmt`,
  });

  const green = getColor('green');
  const red = getColor('red');

  if (isLoading) {
    return (
      <div>
        Analysing check logs...
        <LoadingBar width={300} />
      </div>
    );
  }

  if (data) {
    const isCheckHealthy = data.length === 0;

    return (
      <div className={styles.container}>
        <Icon
          color={isCheckHealthy ? green : red}
          name={isCheckHealthy ? 'check-circle' : 'exclamation-triangle'}
          size="xxxl"
        />
        {isCheckHealthy ? <div>Check is healthy!</div> : <ErrorAnalysis data={data} check={check} />}
      </div>
    );
  }

  return null;
};

const MONACO_ERROR_LINE_CLASS = 'monaco-error-line-highlight-chris';

const ErrorAnalysis = ({ data, check }: { data: PerCheckLogs[]; check: Check }) => {
  const [line, setLine] = useState<number | null>(null);
  // @ts-expect-error
  const script = decode(check.settings?.scripted?.script || check.settings?.browser?.script || ``);
  const hasScript = !!script;

  const { failedExecutions, probesWithFailures, timeouts, errorMsgs } = analyseFailures(data, check);
  const styles = useStyles2(getStyles);

  return (
    <>
      <div>
        <strong>{failedExecutions}</strong> {`${pluralize('execution', failedExecutions)}`} failed for this time range
        <ul className={styles.list}>
          {timeouts !== 0 && (
            <li>
              {timeouts} {`${pluralize('execution', timeouts)}`} had a timeout.
            </li>
          )}
          {Object.entries(errorMsgs).map(([msg, count]) => (
            <Errorline hasScript={hasScript} key={msg} count={count} msg={msg} onClick={(line) => setLine(line)} />
          ))}
        </ul>
        <div>
          <strong>{probesWithFailures.length}</strong> {`${pluralize('probe', probesWithFailures.length)}`} had failures
          ({probesWithFailures.join(', ')}).
        </div>
      </div>
      {hasScript && (
        <CodeEditor
          value={script}
          language="javascript"
          readOnly={true}
          lineHighlight={line && getLineHighlight(line)}
        />
      )}
    </>
  );
};

const Errorline = ({
  count,
  msg,
  onClick,
  hasScript,
}: {
  count: number;
  msg: string;
  onClick: (lineNumber: number) => void;
  hasScript: boolean;
}) => {
  const hasLineReference = msg.includes('file:///script.k6:');

  if (hasLineReference && hasScript) {
    return <ScriptErrorLine count={count} msg={msg} onClick={onClick} hasScript={hasScript} />;
  }

  return (
    <li>
      {count} {`${pluralize('execution', count)}`} had the error message: <code>{msg}</code>
    </li>
  );
};

const ScriptErrorLine = ({
  count,
  msg,
  onClick,
  hasScript,
}: {
  count: number;
  msg: string;
  onClick: (lineNumber: number) => void;
  hasScript: boolean;
}) => {
  const lineNumber = msg.split('file:///script.k6:')[1].split(':')[0];
  const styles = useStyles2(getStyles);

  return (
    <li className={styles.item}>
      <div>
        {count} {`${pluralize('execution', count)}`} had an error message referencing line: <code>{lineNumber}</code>
      </div>
      {hasScript && (
        <Button fill={`text`} onClick={() => onClick(Number(lineNumber))}>
          Show line in script
        </Button>
      )}
    </li>
  );
};

function getLineHighlight(lineNumber: number) {
  return {
    range: {
      startLineNumber: lineNumber,
      startColumn: 1,
      endLineNumber: lineNumber,
      endColumn: 1,
    },
    options: {
      isWholeLine: true,
      className: MONACO_ERROR_LINE_CLASS,
    },
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: grid;
    grid-template-columns: 50px 2fr 3fr;
    gap: ${theme.spacing(2)};

    .${MONACO_ERROR_LINE_CLASS} {
      background-color: ${theme.colors.error.borderTransparent};
    }
  `,
  list: css`
    padding-left: ${theme.spacing(2)};
  `,
  item: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
});

function analyseFailures(checkLogs: PerCheckLogs[], check: Check) {
  const flatten = checkLogs.flatMap(({ checks }) => checks);
  const probesWithFailures = checkLogs.map(({ probe }) => probe);
  const failedExecutions = flatten.length;
  const timeouts = analyzeTimeouts(flatten, check);
  const errorMsgs = analyzeErrorMsgs(flatten);

  return {
    timeouts,
    failedExecutions,
    probesWithFailures,
    errorMsgs,
  };
}

function analyzeTimeouts(checkLogs: CheckLogs[], check: Check) {
  const timeouts = checkLogs.reduce((acc, curr) => {
    const checkFailed = curr[curr.length - 1];
    const duration = checkFailed.value.duration_seconds;
    const exceedsTimeout = Number(duration) > check.timeout / 1000;

    if (exceedsTimeout) {
      acc += 1;
    }
    return acc;
  }, 0);

  return timeouts;
}

const ERROR_MSGS_TO_IGNORE = [MSG_STRINGS_COMMON.CheckFailed, `script did not execute successfully`];

function analyzeErrorMsgs(checkLogs: CheckLogs[]) {
  const errorMsgs = checkLogs.reduce<Record<string, number>>((acc, curr) => {
    const errorLogs = curr.filter(
      (log) => log.value.detected_level === 'error' && !ERROR_MSGS_TO_IGNORE.includes(log.value.msg)
    );

    errorLogs.forEach((log) => {
      const errorMsg = log.value.msg;
      acc[errorMsg] = (acc[errorMsg] || 0) + 1;
    });

    return acc;
  }, {});

  return errorMsgs;
}
