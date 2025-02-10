import React from 'react';
import { Outlet } from 'react-router-dom-v5-compat';
import { NavModelItem } from '@grafana/data';

import { FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';

import { getConfigTabUrl } from '../../ConfigPageLayout.utils';

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

// This component exists to bootstrap secrets data fetching
export function SecretsTab() {
  return <Outlet />;
}
