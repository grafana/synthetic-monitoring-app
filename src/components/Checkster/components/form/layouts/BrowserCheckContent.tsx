import React from 'react';

import { BROWSER_EXAMPLES } from 'components/WelcomeTabs/constants';

import { ScriptedCheckContent } from './ScriptedCheckContent';

export const BROWSER_CHECK_FIELDS = ['job', 'instance', 'settings.browser.channel', 'settings.browser.script'];

export function BrowserCheckContent() {
  return (
    <ScriptedCheckContent
      scriptField="settings.browser.script"
      channelField="settings.browser.channel"
      examples={BROWSER_EXAMPLES}
    />
  );
}
