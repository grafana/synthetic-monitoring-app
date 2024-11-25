import { SelectableValue } from '@grafana/data';

import { CheckEnabledStatus } from 'types';

export const CHECK_LIST_STATUS_OPTIONS: Array<SelectableValue<CheckEnabledStatus>> = [
  { label: 'All', value: CheckEnabledStatus.All },
  { label: 'Enabled', value: CheckEnabledStatus.Enabled },
  { label: 'Disabled', value: CheckEnabledStatus.Disabled },
];
