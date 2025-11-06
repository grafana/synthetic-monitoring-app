import React from 'react';
import { Box, Stack } from '@grafana/ui';

import { CheckType } from 'types';
import { AboutScriptedChecks } from 'components/Checkster/feature/docs/AboutScriptedChecks';
import { AboutSMChecks } from 'components/Checkster/feature/docs/AboutSMChecks';

export const SCRIPTED_DOCS_CHECK_COMPATABILITY: CheckType[] = [CheckType.MULTI_HTTP, CheckType.Scripted];

export function ScriptedCheckDocsPanel() {
  return (
    <Box padding={2}>
      <Stack direction="column" gap={2}>
        <AboutScriptedChecks />
        <AboutSMChecks />
      </Stack>
    </Box>
  );
}
