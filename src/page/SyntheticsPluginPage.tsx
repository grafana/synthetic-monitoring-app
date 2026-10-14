import React, { type ReactNode, useMemo } from 'react';
import { PluginPage } from '@grafana/runtime';
import { useAIAllowed } from 'features/reliabilityInbox/data';

import { FeatureName } from 'types';
import { useUserPermissions } from 'data/permissions';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { getSyntheticsPageNav, SyntheticsTab } from 'page/SyntheticsPageNav';

interface SyntheticsPluginPageProps {
  activeTab: SyntheticsTab;
  children: ReactNode;
}

export function SyntheticsPluginPage({ activeTab, children }: SyntheticsPluginPageProps) {
  const { canReadChecks, canReadProbes } = useUserPermissions();
  const { isEnabled: isRecommendationsEnabled, isReady: isRecommendationsReady } = useFeatureFlag(
    FeatureName.Recommendations
  );
  const { isEnabled: isCheckSuggestionsEnabled } = useFeatureFlag(FeatureName.CheckSuggestions);
  const { allowed: isAIAllowed } = useAIAllowed();
  const pageNav = useMemo(
    () =>
      getSyntheticsPageNav(activeTab, {
        checks: canReadChecks,
        probes: canReadProbes,
        // Its route holds a spinner while the flag resolves, so the tab stays there instead of popping in.
        recommendations:
          canReadChecks &&
          (isRecommendationsEnabled || (activeTab === SyntheticsTab.Recommendations && !isRecommendationsReady)),
        // Same gate as the Check Suggestions banner, plus the permission its page needs.
        checkSuggestions: isCheckSuggestionsEnabled && isAIAllowed && canReadChecks,
      }),
    [
      activeTab,
      canReadChecks,
      canReadProbes,
      isRecommendationsEnabled,
      isRecommendationsReady,
      isCheckSuggestionsEnabled,
      isAIAllowed,
    ]
  );

  return (
    <PluginPage pageNav={pageNav} renderTitle={() => <h1>Synthetics</h1>}>
      {children}
    </PluginPage>
  );
}
