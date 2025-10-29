import React from 'react';

import { CheckUsage } from 'components/CheckUsage';

import { useChecksterContext } from '../contexts/ChecksterContext';

export function UsageEstimation() {
  const { checkType } = useChecksterContext();
  return <CheckUsage checkType={checkType} />;
}
