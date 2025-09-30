import React from 'react';

import { useChecksterContext } from '../../../../contexts/ChecksterContext';
import { ProbeOptions } from './ProbeOptions';

export function GenericProbesSelectField() {
  const {
    checkMeta: { type },
  } = useChecksterContext();

  return <ProbeOptions checkType={type} />;
}
