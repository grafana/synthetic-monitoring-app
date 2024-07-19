import React from 'react';
import { Stack, TextLink } from '@grafana/ui';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesBrowser } from 'types';
import { BrowserCheckInstance } from 'components/CheckEditor/FormComponents/BrowserCheckInstance';
import { BrowserCheckScript } from 'components/CheckEditor/FormComponents/BrowserCheckScript';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

export const CheckBrowserLayout: Partial<Record<LayoutSection, Section<CheckFormValuesBrowser>>> = {
  [LayoutSection.Check]: {
    fields: [`settings.browser.script`, `target`],
    Component: (
      <>
        <BrowserCheckInstance />
        <BrowserCheckScript />
      </>
    ),
  },
  [LayoutSection.Uptime]: {
    fields: [`timeout`],
    Component: (
      <Stack direction={`column`} gap={4}>
        <div>
          Include uptime checks and assertions in your script. See the docs about {` `}
          <TextLink href={`https://grafana.com/docs/k6/latest/javascript-api/k6/check/`} external>
            running checks in a k6 script.
          </TextLink>
        </div>
        <Timeout min={5.0} />
      </Stack>
    ),
  },
};
