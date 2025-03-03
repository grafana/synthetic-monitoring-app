import React, { useCallback, useState } from 'react';
import { GrafanaTheme2, TimeRange } from '@grafana/data';
import { Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckLogs } from 'features/logParsing/logs.types';
import { CheckLogsDisplay } from 'scenes/Common/CheckLogs/CheckLogsDisplay';
import { CheckLogVis } from 'scenes/Common/CheckLogs/CheckLogVis';

export const ChecksByProbe = ({
  probe,
  checks,
  timeRange,
}: {
  probe: string;
  checks: CheckLogs[];
  timeRange: TimeRange;
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const styles = useStyles2(getStyles);

  const handleClick = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  return (
    <div>
      <Text variant="h3">{probe}</Text>
      <div className={styles.container}>
        <Stack wrap={'wrap'}>
          {checks.map((check, index) => (
            <CheckLogVis
              key={check[0].time}
              check={check}
              onClick={() => handleClick(index)}
              isSelected={selectedIndex === index}
            />
          ))}
        </Stack>
        <div>{selectedIndex !== null ? <CheckLogsDisplay checkLogs={checks[selectedIndex]} /> : <EmptyState />}</div>
      </div>
    </div>
  );
};

const EmptyState = () => {
  return <div>Select a check to view</div>;
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: grid;
      gap: ${theme.spacing(2)};
      grid-template-columns: 3fr 2fr;
    `,
  };
};
