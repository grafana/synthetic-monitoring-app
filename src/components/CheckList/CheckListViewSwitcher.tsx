import { RadioButtonGroup } from '@grafana/ui';
import { CHECK_LIST_VIEW_TYPE_LS_KEY, CHECK_LIST_VIEW_TYPE_OPTIONS } from 'components/constants';
import React from 'react';
import { CheckListViewType } from 'types';

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
