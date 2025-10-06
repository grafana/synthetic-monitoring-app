import React from 'react';

import { BROWSER_EXAMPLES } from 'components/WelcomeTabs/constants';

import { ScriptedCheckContent } from './ScriptedCheckContent';

export function BrowserCheckContent() {
  return (
    <ScriptedCheckContent label="Browser script" scriptField="settings.browser.script" examples={BROWSER_EXAMPLES} />
  );
}
