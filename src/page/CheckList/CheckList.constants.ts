import { ComboboxOption } from '@grafana/ui';

import { CheckEnabledStatus } from 'types';

export const CHECK_LIST_STATUS_OPTIONS: Array<ComboboxOption<CheckEnabledStatus>> = [
  { label: 'All', value: CheckEnabledStatus.All },
  { label: 'Enabled', value: CheckEnabledStatus.Enabled },
  { label: 'Disabled', value: CheckEnabledStatus.Disabled },
];
