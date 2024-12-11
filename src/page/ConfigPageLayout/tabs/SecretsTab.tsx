import React from 'react';
import { NavModelItem } from '@grafana/data';

import { FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';

import { ConfigContent } from '../components/ConfigContent';
import { SecretsTable } from '../components/SecretsTable';
import { getConfigTabUrl } from '../ConfigPageLayout.utils';

const navModelItem: NavModelItem = {
  icon: 'lock',
  text: 'Secrets',
  url: getConfigTabUrl('secrets'),
};

export function getSecretsNavModel(isActive = false) {
  if (!isFeatureEnabled(FeatureName.SecretsManagement)) {
    return [];
  }

  return [
    {
      ...navModelItem,
      active: isActive,
    },
  ];
}

export function SecretsTab() {
  return (
    <ConfigContent title="Secrets">
      <ConfigContent.Section>
        <p>This tab allows you to manage secrets that are used in Synthetic Monitoring.</p>
      </ConfigContent.Section>
      <ConfigContent.Section>
        <SecretsTable />
      </ConfigContent.Section>
    </ConfigContent>
  );
}
