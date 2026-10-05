import { ComponentType } from 'react';
import { IconName } from '@grafana/ui';

import { CheckAlertDraft, CheckType } from 'types';

import { BrokenLinksDrawer } from './BrokenLinksDrawer';
import { BROKEN_LINKS_ALERTS } from './templateAlerts';

export interface CheckTemplateDefinition {
  id: 'broken_links';
  title: string;
  icon: IconName;
  description: string;
  checkType: CheckType;
  alerts: CheckAlertDraft[];
  Drawer: ComponentType<{ onClose: () => void; alerts: CheckAlertDraft[] }>;
}

export const CHECK_TEMPLATES: CheckTemplateDefinition[] = [
  {
    id: 'broken_links',
    title: 'Detect broken links',
    icon: 'link-broken',
    description: 'Check a page for links that no longer work.',
    checkType: CheckType.Browser,
    Drawer: BrokenLinksDrawer,
    alerts: BROKEN_LINKS_ALERTS,
  },
];
