import React from 'react';
import { Box, Stack } from '@grafana/ui';

import { AboutBrowserChecks } from 'components/Checkster/feature/docs/AboutBrowserChecks';
import { Aboutk6Studio } from 'components/Checkster/feature/docs/Aboutk6Studio';
import {
  DOC_LINK_K6_BROWSER_CHECKS,
  DOC_LINK_K6_BROWSER_MODULE_API,
  DOC_LINK_K6_JAVASCRIPT_API,
  DOC_LINK_K6_STUDIO_RECORD_FIRST_SCRIPT,
  DOC_LINK_SECRETS,
} from 'components/Checkster/feature/docs/constants';
import { DocumentationLinks } from 'components/Checkster/feature/docs/DocumentationLinks';

export const DocsPanelBrowserCheck = () => {
  const source = 'check_editor_sidepanel_browser_docs';

  return (
    <Box padding={2}>
      <Stack direction="column" gap={2}>
        <AboutBrowserChecks />
        <Aboutk6Studio source={source} />
        <DocumentationLinks
          links={[
            DOC_LINK_K6_STUDIO_RECORD_FIRST_SCRIPT,
            DOC_LINK_K6_BROWSER_CHECKS,
            DOC_LINK_K6_BROWSER_MODULE_API,
            DOC_LINK_K6_JAVASCRIPT_API,
            DOC_LINK_SECRETS,
          ]}
          source={source}
        />
      </Stack>
    </Box>
  );
};
