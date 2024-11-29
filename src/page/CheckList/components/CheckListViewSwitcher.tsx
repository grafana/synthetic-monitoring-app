import React from 'react';
import { RadioButtonGroup } from '@grafana/ui';

import { CheckListViewType } from 'page/CheckList/CheckList.types';

const CHECK_LIST_VIEW_TYPE_OPTIONS = [
  { description: 'Card view', value: CheckListViewType.Card, icon: 'check-square' },
  { description: 'List view', value: CheckListViewType.List, icon: 'list-ul' },
  { description: 'Visualization view', value: CheckListViewType.Viz, icon: 'gf-grid' },
];

interface CheckListViewSwitcherProps {
  viewType: CheckListViewType;
  onChange: (viewType: CheckListViewType) => void;
}

export function CheckListViewSwitcher({ viewType, onChange }: CheckListViewSwitcherProps) {
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
