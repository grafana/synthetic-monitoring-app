import React from 'react';
import { AiCheckExplanationsSetting } from 'features/checkInsights/AiCheckExplanationsSetting';

import { ConfigContent } from '../ConfigContent';

// Its own tab, separate from General, so future AI features have a home without General
// growing into a catch-all.
export function AiTab() {
  return (
    <ConfigContent title="AI features">
      <ConfigContent.Section title="Check failure explanations">
        <AiCheckExplanationsSetting />
      </ConfigContent.Section>
    </ConfigContent>
  );
}
