import { createSMEventFactory } from 'features/tracking/createEventFactory';

import { CheckType } from 'types';

type CheckFormEvent = {
  checkState: `new` | `existing`;
  checkType: CheckType;
};

const checkFormEvents = createSMEventFactory('check_form');

type NavigateWizardForm = CheckFormEvent & {
  step: 'job' | 'uptime' | 'labels' | 'alerting' | 'execution';
  component: `forward-button` | `back-button` | `stepper`;
};

export const trackNavigateWizardForm = checkFormEvents<NavigateWizardForm>('navigate_wizard_form');

export const trackAdhocCreated = checkFormEvents<CheckFormEvent>('adhoc_test_created');

export const trackCheckCreated = checkFormEvents<CheckFormEvent>('check_created');
