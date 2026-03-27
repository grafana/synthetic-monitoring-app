import React, { useMemo } from 'react';

import { FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { BROWSER_EXAMPLES } from 'components/WelcomeTabs/constants';

import { ScriptedCheckContent } from './ScriptedCheckContent';

export const BROWSER_CHECK_FIELDS = ['job', 'target', 'channels.k6', 'settings.browser.script'];

const SCREENSHOT_EXAMPLE_VALUE = 'screenshots.js';

export function BrowserCheckContent() {
  const { isEnabled: screenshotsEnabled } = useFeatureFlag(FeatureName.Screenshots);

  const examples = useMemo(
    () => (screenshotsEnabled ? BROWSER_EXAMPLES : BROWSER_EXAMPLES.filter((e) => e.value !== SCREENSHOT_EXAMPLE_VALUE)),
    [screenshotsEnabled]
  );

  return (
    <ScriptedCheckContent
      scriptField="settings.browser.script"
      examples={examples}
    />
  );
}
