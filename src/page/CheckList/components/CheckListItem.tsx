import React from 'react';

import { CheckListViewType } from 'page/CheckList/CheckList.types';
import { Check, CheckType, Label } from 'types';
import { CheckRuntimeAlertState } from 'data/useCheckAlertStates';
import { CheckListItemCard } from 'page/CheckList/components/CheckListItemCard';
import { CheckListItemRow } from 'page/CheckList/components/CheckListItemRow';
import type { SLO } from 'scenes/Common/grafanaSLOApp.types';

export interface CheckListItemProps {
  check: Check;
  runtimeAlertState: CheckRuntimeAlertState;
  slos: SLO[];
  calNames: string[];
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
