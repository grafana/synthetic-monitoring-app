import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { LOG_LABELS_COMMON, LOG_LABELS_SM } from 'features/logParsing/logs.constants.labels';

import { LabelsWithTime } from 'features/logParsing/logs.types';

interface LogLineProps {
  log: LabelsWithTime;
}

export const LogLine = ({ log }: LogLineProps) => {
  const parsedLine = parseLine(log);
  const { msg, level, ...rest } = parsedLine;
  const styles = useStyles2((theme) => getStyles(theme, level));
  const [open, setOpen] = useState(false);

  if (open) {
    console.log(stripCommonLabels(rest));
  }

  return (
    <div className={styles.container}>
      <Button fill="text" onClick={() => setOpen(!open)} icon={open ? 'angle-up' : 'angle-down'}>
        <div>{msg}</div>
      </Button>
      {open && (
        <div>
          {Object.entries(stripCommonLabels(rest)).map(([key, value]) => (
            <div key={key}>{`${key}: ${value}`}</div>
          ))}
        </div>
      )}
    </div>
  );
};

function parseLine(log: LabelsWithTime) {
  const filteredLine = Object.entries(log.value)
    .filter(([key]) => !key.includes(`_extracted`))
    .reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  return filteredLine;
}

function stripCommonLabels(labels: Record<string, string>) {
  return Object.entries(labels)
    .filter(([key]) => ![...LOG_LABELS_COMMON, ...LOG_LABELS_SM].includes(key))
    .reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
}

const getStyles = (theme: GrafanaTheme2, level: string) => {
  const isError = level === 'error';
  const isInfo = level === 'info';

  return {
    container: css`
      /* display: flex;
      justify-content: space-between; */
      padding: ${theme.spacing(1)};
      border: 1px solid
        ${isError ? theme.colors.error.main : isInfo ? theme.colors.info.main : theme.colors.border.weak};
      border-radius: ${theme.shape.radius.default};
    `,
  };
};
