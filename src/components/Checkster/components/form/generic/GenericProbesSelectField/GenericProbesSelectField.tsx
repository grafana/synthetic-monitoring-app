import React from 'react';

import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';

import { useChecksterContext } from '../../../../contexts/ChecksterContext';

export function GenericProbesSelectField() {
  const { checkType } = useChecksterContext();

  return <ProbeOptions checkType={checkType} />;
}
