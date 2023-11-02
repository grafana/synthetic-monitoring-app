import React from 'react';
import { RadioButtonGroup } from '@grafana/ui';

import { CheckListViewType } from 'types';
import { CHECK_LIST_VIEW_TYPE_LS_KEY, CHECK_LIST_VIEW_TYPE_OPTIONS } from 'components/constants';

interface Props {
  viewType: CheckListViewType;
  setViewType: (viewType: CheckListViewType) => void;
  setCurrentPage: (pageNumber: number) => void;
}

export function CheckListViewSwitcher({ viewType, setViewType, setCurrentPage }: Props) {
  return (
    <RadioButtonGroup
      value={viewType}
      onChange={(value) => {
        if (value !== undefined) {
          setViewType(value);
          window.localStorage.setItem(CHECK_LIST_VIEW_TYPE_LS_KEY, String(value));
          setCurrentPage(1);
        }
      }}
      options={CHECK_LIST_VIEW_TYPE_OPTIONS}
    />
  );
}
