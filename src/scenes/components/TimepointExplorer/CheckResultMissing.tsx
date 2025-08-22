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
          This check did not return any results for this timepoint. Since it ran the check has been updated so we are
          unable to establish what probes it should have ran on.
        </Text>
        <ReasonsForMissingResult isPublic={false} />
      </Stack>
    </ResultUnknown>
  );
};
