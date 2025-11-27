import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

import { CheckType } from 'types';
import { SectionName } from 'components/CheckForm/FormLayout/FormLayout.constants';
import { FeatureTabLabel } from 'components/Checkster/types';

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

interface NeedHelpScriptsButtonClicked extends TrackingEventProps {
  /** The source of the clicked button */
  source: string;
}

/** Tracks when the 'need help writing scripts' button is clicked. */
export const trackNeedHelpScriptsButtonClicked = checkFormEvents<NeedHelpScriptsButtonClicked>(
  'need_help_scripts_button_clicked'
);

interface FeatureTabChanged extends TrackingEventProps {
  /** The label of the feature tab. */
  label: FeatureTabLabel;
}

/** Tracks when a feature tab is changed. */
export const trackFeatureTabChanged = checkFormEvents<FeatureTabChanged>('feature_tab_changed');
