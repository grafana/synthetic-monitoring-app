import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

import { CheckType } from 'types';
import { ANALYTICS_STEP_MAP } from 'components/CheckForm/FormLayout/FormLayout.constants';

const checkFormEvents = createSMEventFactory('check_form');

interface NavigateWizardForm extends TrackingEventProps {
  checkType: CheckType;
  step: (typeof ANALYTICS_STEP_MAP)[number];
  component: `forward-button` | `back-button` | `stepper`;
}

export const trackNavigateWizardForm = checkFormEvents<NavigateWizardForm>('navigate_wizard_form_button_clicked');

interface AdhocCheckEvent extends TrackingEventProps {
  checkType: CheckType;
  checkState: `new` | `existing`;
}

export const trackAdhocCreated = checkFormEvents<AdhocCheckEvent>('adhoc_test_created');

interface CheckFormEvent extends TrackingEventProps {
  checkType: CheckType;
}

export const trackCheckCreated = checkFormEvents<CheckFormEvent>('check_created');

export const trackCheckUpdated = checkFormEvents<CheckFormEvent>('check_updated');
