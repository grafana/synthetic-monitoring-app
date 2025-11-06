import React from 'react';
import { Box, Stack } from '@grafana/ui';

import { CheckType } from 'types';
import { AboutSMChecks } from 'components/Checkster/feature/docs/AboutSMChecks';
import { DOC_LINK_CHECK_TYPES, DOC_LINK_PUBLIC_PROBES } from 'components/Checkster/feature/docs/constants';
import { DocumentationLinks } from 'components/Checkster/feature/docs/DocumentationLinks';

export const MULTI_STEP_DOCS_CHECK_COMPATABILITY: CheckType[] = [CheckType.MULTI_HTTP];

export function DocsPanelMultiStep() {
  return (
    <Box padding={2}>
      <Stack direction="column" gap={2}>
        <AboutSMChecks />
        <DocumentationLinks links={[DOC_LINK_CHECK_TYPES, DOC_LINK_PUBLIC_PROBES]} />
      </Stack>
    </Box>
  );
}
