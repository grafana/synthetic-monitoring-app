import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

import { CheckType } from 'types';
import { SectionName } from 'components/CheckForm/FormLayout/FormLayout.constants';

const checkFormEvents = createSMEventFactory('check_form');

interface NavigateWizardForm extends TrackingEventProps {
  /** The type of check. */
  checkType: CheckType;
  /** The current step in the wizard. */
  step: SectionName;
  /** The UI component that triggered the navigation. */
  component: `forward-button` | `back-button` | `stepper`;
}

/** Tracks navigation events within the check form wizard. */
export const trackNavigateWizardForm = checkFormEvents<NavigateWizardForm>('navigate_wizard_form_button_clicked');

interface AdhocCheckEvent extends TrackingEventProps {
  /** The type of check. */
  checkType: CheckType;
  /** Whether the check is new or existing. */
  checkState: `new` | `existing`;
}

/** Tracks when an adhoc test is successfully created. */
export const trackAdhocCreated = checkFormEvents<AdhocCheckEvent>('adhoc_test_created');

interface CheckFormEvent extends TrackingEventProps {
  /** The type of check. */
  checkType: CheckType;
}

/** Tracks when a check is successfully created. */
export const trackCheckCreated = checkFormEvents<CheckFormEvent>('check_created');

/** Tracks when a check is successfully updated. */
export const trackCheckUpdated = checkFormEvents<CheckFormEvent>('check_updated');
