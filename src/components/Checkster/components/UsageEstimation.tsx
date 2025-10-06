import React from 'react';

import { CheckUsage } from 'components/CheckUsage';

import { useChecksterContext } from '../contexts/ChecksterContext';

export function UsageEstimation() {
  const {
    checkMeta: { type },
  } = useChecksterContext();
  return <CheckUsage checkType={type} />;
}
