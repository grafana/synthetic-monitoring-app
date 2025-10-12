import React from 'react';

import { useChecksterContext } from '../../../../contexts/ChecksterContext';
import { ProbeOptions } from './ProbeOptions';

export function GenericProbesSelectField() {
  const { checkType } = useChecksterContext();

  return <ProbeOptions checkType={checkType} />;
}
