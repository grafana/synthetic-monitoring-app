import React, { type ReactNode, useMemo } from 'react';
import { PluginPage } from '@grafana/runtime';

import { getSyntheticsPageNav, SyntheticsTab } from 'page/SyntheticsPageNav';

interface SyntheticsPluginPageProps {
  activeTab: SyntheticsTab;
  actions?: ReactNode;
  children: ReactNode;
}

export function SyntheticsPluginPage({ activeTab, actions, children }: SyntheticsPluginPageProps) {
  const pageNav = useMemo(() => getSyntheticsPageNav(activeTab), [activeTab]);

  return (
    <PluginPage pageNav={pageNav} renderTitle={() => <h1>Synthetics</h1>} actions={actions}>
      {children}
    </PluginPage>
  );
}
