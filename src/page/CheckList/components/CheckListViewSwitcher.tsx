import React, { useMemo } from 'react';
import { RadioButtonGroup } from '@grafana/ui';

import { CheckListViewType } from 'page/CheckList/CheckList.types';

const BASE_VIEW_TYPE_OPTIONS = [
  { description: 'Card view', value: CheckListViewType.Card, icon: 'check-square' },
  { description: 'List view', value: CheckListViewType.List, icon: 'list-ul' },
];

const FOLDER_VIEW_OPTION = { description: 'Folder view', value: CheckListViewType.Folder, icon: 'folder' };

interface CheckListViewSwitcherProps {
  viewType: CheckListViewType;
  onChange: (viewType: CheckListViewType) => void;
  isFoldersAvailable: boolean;
}

export function CheckListViewSwitcher({ viewType, onChange, isFoldersAvailable }: CheckListViewSwitcherProps) {
  const options = useMemo(() => {
    if (isFoldersAvailable) {
      return [FOLDER_VIEW_OPTION, ...BASE_VIEW_TYPE_OPTIONS];
    }
    return BASE_VIEW_TYPE_OPTIONS;
  }, [isFoldersAvailable]);

  return (
    <RadioButtonGroup
      value={viewType}
      onChange={(val) => {
        onChange(val);
      }}
      options={options}
    />
  );
}
