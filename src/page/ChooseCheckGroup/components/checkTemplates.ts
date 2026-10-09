import { ComponentType } from 'react';
import { IconName } from '@grafana/ui';

import { CheckAlertDraft, CheckType } from 'types';

import { AgenticJourneyDrawer } from './AgenticJourneyDrawer';
import { BrokenLinksDrawer } from './BrokenLinksDrawer';
import { AGENTIC_JOURNEY_ALERTS,BROKEN_LINKS_ALERTS } from './templateAlerts';
import { CheckTemplateId } from './templateTypes';

export interface CheckTemplateDefinition {
  id: CheckTemplateId;
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
  {
    id: 'agentic_journey',
    title: 'Agentic journey',
    icon: 'sitemap',
    description: 'Describe the steps of a flow in plain language and have AI run them.',
    checkType: CheckType.Browser,
    Drawer: AgenticJourneyDrawer,
    alerts: AGENTIC_JOURNEY_ALERTS,
  },
];
