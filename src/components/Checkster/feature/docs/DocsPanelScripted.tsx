import React from 'react';
import { Box, Stack } from '@grafana/ui';

import { Aboutk6Studio } from 'components/Checkster/feature/docs/Aboutk6Studio';
import { AboutScriptedChecks } from 'components/Checkster/feature/docs/AboutScriptedChecks';
import {
  DOC_LINK_K6_JAVASCRIPT_API,
  DOC_LINK_K6_SCRIPTED_CHECKS,
  DOC_LINK_K6_STUDIO_RECORD_FIRST_SCRIPT,
  DOC_LINK_SECRETS,
} from 'components/Checkster/feature/docs/constants';
import { DocumentationLinks } from 'components/Checkster/feature/docs/DocumentationLinks';

export const DocsPanelScriptedCheck = () => {
  const source = 'check_editor_sidepanel_scripted_docs';

  return (
    <Box padding={2}>
      <Stack direction="column" gap={2}>
        <AboutScriptedChecks />
        <Aboutk6Studio source={source} />
        <DocumentationLinks
          links={[
            DOC_LINK_K6_STUDIO_RECORD_FIRST_SCRIPT,
            DOC_LINK_K6_SCRIPTED_CHECKS,
            DOC_LINK_K6_JAVASCRIPT_API,
            DOC_LINK_SECRETS,
          ]}
          source={source}
        />
      </Stack>
    </Box>
  );
};
