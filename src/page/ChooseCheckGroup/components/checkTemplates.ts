import { ComponentType } from 'react';
import { IconName } from '@grafana/ui';

import { CheckType } from 'types';

import { BrokenLinksDrawer } from './BrokenLinksDrawer';

export interface CheckTemplateDefinition {
  id: 'broken_links';
  title: string;
  icon: IconName;
  description: string;
  checkType: CheckType;
  Drawer: ComponentType<{ onClose: () => void }>;
}

export const CHECK_TEMPLATES: CheckTemplateDefinition[] = [
  {
    id: 'broken_links',
    title: 'Detect broken links',
    icon: 'link-broken',
    description: 'Check a page for links that no longer work.',
    checkType: CheckType.Browser,
    Drawer: BrokenLinksDrawer,
  },
];
