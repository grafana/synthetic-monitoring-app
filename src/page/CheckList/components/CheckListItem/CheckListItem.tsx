import React from 'react';

import { CheckListViewType } from 'page/CheckList/types';
import { Check, CheckType, Label } from 'types';
import { CheckListItemCard } from 'page/CheckList/components/CheckListItem/CheckListItemCard';
import { CheckListItemRow } from 'page/CheckList/components/CheckListItem/CheckListItemRow';

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
