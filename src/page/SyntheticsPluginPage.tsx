import React, { type ReactNode, useMemo } from 'react';
import { PluginPage } from '@grafana/runtime';

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
  const { isEnabled: isCheckSuggestionsEnabled } = useFeatureFlag(FeatureName.CheckSuggestions);
  const pageNav = useMemo(
    () =>
      getSyntheticsPageNav(activeTab, {
        checks: canReadChecks,
        probes: canReadProbes,
        recommendations: isCheckSuggestionsEnabled && canReadChecks,
      }),
    [activeTab, canReadChecks, canReadProbes, isCheckSuggestionsEnabled]
  );

  return (
    <PluginPage pageNav={pageNav} renderTitle={() => <h1>Synthetics</h1>}>
      {children}
    </PluginPage>
  );
}
