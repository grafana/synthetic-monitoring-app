import { createSMEventFactory } from 'features/tracking/createEventFactory';

import { CheckType } from 'types';
import { ANALYTICS_STEP_MAP } from 'components/CheckForm/FormLayout/FormLayout.constants';

type CheckFormEvent = {
  checkState: `new` | `existing`;
  checkType: CheckType;
};

const checkFormEvents = createSMEventFactory('check_form');

type NavigateWizardForm = CheckFormEvent & {
  step: (typeof ANALYTICS_STEP_MAP)[number];
  component: `forward-button` | `back-button` | `stepper`;
};

export const trackNavigateWizardForm = checkFormEvents<NavigateWizardForm>('navigate_wizard_form');

export const trackAdhocCreated = checkFormEvents<CheckFormEvent>('adhoc_test_created');

export const trackCheckCreated = checkFormEvents<CheckFormEvent>('check_created');
