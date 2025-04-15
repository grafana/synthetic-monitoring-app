import { createSMEventFactory } from 'features/tracking/createEventFactory';

import { CheckType } from 'types';
import { ANALYTICS_STEP_MAP } from 'components/CheckForm/FormLayout/FormLayout.constants';

const checkFormEvents = createSMEventFactory('check_form');

/**
 * Base event type for check form interactions.
 */
type CheckFormEvent = {
  /** Whether the check is new or existing. */
  checkState: `new` | `existing`;
  /** The type of check. */
  checkType: CheckType;
};

/**
 * Event type for navigation within the check form wizard.
 */
type NavigateWizardForm = CheckFormEvent & {
  /** The current step in the wizard. */
  step: (typeof ANALYTICS_STEP_MAP)[number];
  /** The UI component that triggered the navigation. */
  component: `forward-button` | `back-button` | `stepper`;
};

/** Tracks navigation events within the check form wizard. */
export const trackNavigateWizardForm = checkFormEvents<NavigateWizardForm>('navigate_wizard_form');

/** Tracks when an adhoc test is created. */
export const trackAdhocCreated = checkFormEvents<CheckFormEvent>('adhoc_test_created');

/** Tracks when a regular check is created. */
export const trackCheckCreated = checkFormEvents<CheckFormEvent>('check_created');
