import { ComboboxOption } from '@grafana/ui';

import { CheckEnabledStatus } from 'types';

export const CHECK_LIST_STATUS_OPTIONS: Array<ComboboxOption<CheckEnabledStatus>> = [
  { label: 'All', value: CheckEnabledStatus.All },
  { label: 'Enabled', value: CheckEnabledStatus.Enabled },
  { label: 'Disabled', value: CheckEnabledStatus.Disabled },
];

export const CHECK_LIST_CARD_CONTAINER_NAME = 'check-list-card';

export type UnattributedMessagePosition = 'before-cals' | 'after-cals' | 'after-labels';

export const UNATTRIBUTED_MESSAGE_POSITION: UnattributedMessagePosition = 'before-cals';
