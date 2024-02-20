import React from 'react';
import { RadioButtonGroup } from '@grafana/ui';

import { CheckListViewType } from 'types';
import { CHECK_LIST_VIEW_TYPE_OPTIONS } from 'components/constants';

interface Props {
  viewType: CheckListViewType;
  onChange: (viewType: CheckListViewType) => void;
}

export function CheckListViewSwitcher({ viewType, onChange }: Props) {
  return (
    <RadioButtonGroup
      value={viewType}
      onChange={(val) => {
        onChange(val);
      }}
      options={CHECK_LIST_VIEW_TYPE_OPTIONS}
    />
  );
}
