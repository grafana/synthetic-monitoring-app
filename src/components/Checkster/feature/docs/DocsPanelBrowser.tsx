import React from 'react';
import { Box, Stack } from '@grafana/ui';

import { CheckType } from 'types';
import { AboutBrowserChecks } from 'components/Checkster/feature/docs/AboutBrowserChecks';
import { Aboutk6Stuido } from 'components/Checkster/feature/docs/Aboutk6Studio';
import {
  DOC_LINK_K6_BROWSER_CHECKS,
  DOC_LINK_K6_BROWSER_MODULE_API,
  DOC_LINK_K6_JAVASCRIPT_API,
  DOC_LINK_K6_STUDIO_RECORD_FIRST_SCRIPT,
  DOC_LINK_SECRETS,
} from 'components/Checkster/feature/docs/constants';
import { DocumentationLinks } from 'components/Checkster/feature/docs/DocumentationLinks';

export const BROWSER_CHECK_DOCS_CHECK_COMPATABILITY: CheckType[] = [CheckType.Browser];

export function DocsPanelBrowserCheck() {
  return (
    <Box padding={2}>
      <Stack direction="column" gap={2}>
        <AboutBrowserChecks />
        <Aboutk6Stuido />
        <DocumentationLinks
          links={[
            DOC_LINK_K6_STUDIO_RECORD_FIRST_SCRIPT,
            DOC_LINK_K6_BROWSER_CHECKS,
            DOC_LINK_K6_BROWSER_MODULE_API,
            DOC_LINK_K6_JAVASCRIPT_API,
            DOC_LINK_SECRETS,
          ]}
        />
      </Stack>
    </Box>
  );
}
