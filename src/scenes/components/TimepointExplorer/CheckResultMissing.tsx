import React from 'react';
import { Stack, Text } from '@grafana/ui';

import { ReasonsForMissingResult } from 'scenes/components/TimepointExplorer/ReasonsForMissingResult';
import { ResultUnknown } from 'scenes/components/TimepointExplorer/ResultUnknown';

import { grotPropsMagnifyingGlass } from 'img';

export const CheckResultMissing = () => {
  return (
    <ResultUnknown image={<img src={grotPropsMagnifyingGlass} alt="" />} title="Check result missing">
      <Stack direction="column" gap={2}>
        <Text>
          No results were found for this timepoint. The check has been modified since it ran, so we cannot determine
          which probes were configured to run.
        </Text>
        <ReasonsForMissingResult isPublic={false} />
      </Stack>
    </ResultUnknown>
  );
};
