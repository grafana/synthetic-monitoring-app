import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, Button, Stack, Tag, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { LOG_LABELS_COMMON, LOG_LABELS_SM } from 'features/parseCheckLogs/checkLogs.constants.labels';

import { LabelsWithTime } from 'features/parseCheckLogs/checkLogs.types';
import { useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';
import { getColor } from 'page/CheckDrilldown/utils/colors';

interface LogLineProps {
  log: LabelsWithTime;
}

export const LogLine = ({ log }: LogLineProps) => {
  const parsedLine = parseLine(log);
  const { msg, level, source, ...rest } = parsedLine;
  const styles = useStyles2((theme) => getStyles(theme, level));
  const [open, setOpen] = useState(false);
  const { changeTab } = useCheckDrilldown();

  return (
    <div className={styles.container}>
      <Button
        fill="text"
        onClick={() => setOpen(!open)}
        icon={open ? 'angle-up' : 'angle-down'}
        className={styles.button}
      >
        <div>{msg}</div>
      </Button>
      {open && (
        <Box padding={2}>
          <Stack direction={`column`} gap={1}>
            <Text element="h4" variant="h6">
              Log labels
            </Text>
            <Stack wrap>
              {Object.entries(stripCommonLabels(rest)).map(([key, value]) => (
                <Tag key={key} name={`${key}: ${value}`} colorIndex={1} />
              ))}
            </Stack>
            {level === `error` && (
              <Stack direction={`column`} gap={1}>
                <Text>There might be common issues with this check. Run error analysis?</Text>
                <div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      changeTab(2);
                    }}
                  >
                    Analyze failures
                  </Button>
                </div>
              </Stack>
            )}
          </Stack>
        </Box>
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
    .filter(([key]) => !key.startsWith(`label_`))
    .reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
}

const getStyles = (theme: GrafanaTheme2, level: string) => {
  const isError = level === 'error';
  const isInfo = level === 'info';
  const redBorder = getColor('red', `border`);

  return {
    container: css`
      /* display: flex;
      justify-content: space-between; */
      padding: ${theme.spacing(1)};
      border: 1px solid ${isError ? redBorder : isInfo ? theme.colors.info.main : theme.colors.border.weak};
      border-radius: ${theme.shape.radius.default};
    `,
    button: css`
      height: auto;
      text-align: left;
      color: ${isError ? redBorder : isInfo ? theme.colors.info.main : theme.colors.border.weak};
      font-size: ${theme.typography.body.fontSize};

      span {
        white-space: initial;
      }
    `,
  };
};
