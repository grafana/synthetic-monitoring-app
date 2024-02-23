import React from 'react';

import { Check, CheckListViewType, CheckType, Label } from 'types';

import { CheckListItemCard } from './CheckListItemCard';
import { CheckListItemRow } from './CheckListItemRow';

export interface CheckListItemProps {
  check: Check;
  selected: boolean;
  onLabelSelect: (label: Label) => void;
  onToggleCheckbox: (checkId: number) => void;
  onTypeSelect: (checkType: CheckType) => void;
  onStatusSelect: (checkStatus: boolean) => void;
}

export const CheckListItem = ({ viewType, ...props }: CheckListItemProps & { viewType: CheckListViewType }) => {
  if (viewType === CheckListViewType.List) {
    return <CheckListItemRow {...props} />;
  }

  return <CheckListItemCard {...props} />;
};
