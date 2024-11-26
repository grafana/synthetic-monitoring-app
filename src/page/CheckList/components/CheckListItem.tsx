import React from 'react';

import { CheckListViewType } from 'page/CheckList/CheckList.types';
import { Check, CheckType, Label } from 'types';
import { CheckListItemCard } from 'page/CheckList/components/CheckListItemCard';
import { CheckListItemRow } from 'page/CheckList/components/CheckListItemRow';

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
