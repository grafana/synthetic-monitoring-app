import { NavModelItem } from '@grafana/data';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

export const ASSISTANT_ORIGIN = 'grafana-synthetic-monitoring-app/reliability-inbox';

export const RELIABILITY_INBOX_PAGE_NAV: NavModelItem = {
  text: 'Reliability Inbox',
  parentItem: {
    text: 'Synthetics',
    url: generateRoutePath(AppRoutes.Home),
  },
};
