import React, { useMemo } from 'react';
import { RadioButtonGroup } from '@grafana/ui';

import { CheckListViewType } from 'page/CheckList/CheckList.types';
import { FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';

const BASE_VIEW_TYPE_OPTIONS = [
  { description: 'Card view', value: CheckListViewType.Card, icon: 'check-square' },
  { description: 'List view', value: CheckListViewType.List, icon: 'list-ul' },
];

const FOLDER_VIEW_OPTION = { description: 'Folder view', value: CheckListViewType.Folder, icon: 'folder' };

interface CheckListViewSwitcherProps {
  viewType: CheckListViewType;
  onChange: (viewType: CheckListViewType) => void;
}

export function CheckListViewSwitcher({ viewType, onChange }: CheckListViewSwitcherProps) {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const options = useMemo(() => {
    if (isFoldersEnabled) {
      return [...BASE_VIEW_TYPE_OPTIONS, FOLDER_VIEW_OPTION];
    }
    return BASE_VIEW_TYPE_OPTIONS;
  }, [isFoldersEnabled]);

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
