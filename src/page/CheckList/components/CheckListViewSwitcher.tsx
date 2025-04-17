import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { RadioButtonGroup, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckListViewType } from 'page/CheckList/CheckList.types';

interface CheckListViewSwitcherProps {
  viewType: CheckListViewType;
  onChange: (viewType: CheckListViewType) => void;
}

const VIEW_OPTIONS = [
  { description: 'Card view', value: CheckListViewType.Card, icon: 'apps' },
  { description: 'List view', value: CheckListViewType.List, icon: 'list-ul' },
];

export function CheckListViewSwitcher({ viewType, onChange }: CheckListViewSwitcherProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <RadioButtonGroup options={VIEW_OPTIONS} value={viewType} onChange={onChange} />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    alignItems: 'center',
  }),
});
