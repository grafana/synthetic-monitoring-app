import React from 'react';
import { useFormContext } from 'react-hook-form';

import { Check, CheckFormValues, CheckType } from '../../types';

import { ConfirmLeavingPage } from '../ConfirmLeavingPage';
import { FormRoot } from './components/form/FormRoot';
import { FormSectionNavigation } from './components/FormSectionNavigation/FormSectionNavigation';
import { ChooseCheckTypeModal } from './components/modals/ChooseCheckTypeModal';
import { AppContainer } from './components/ui/AppContainer';
import { PrimaryLayoutSection } from './components/ui/PrimaryLayoutSection';
import { SecondaryLayoutSection } from './components/ui/SecondaryLayoutSection';
import { InternalConditionalProvider, useChecksterContext } from './contexts/ChecksterContext';
import { FeatureTabsContextProvider } from './contexts/FeatureTabsContext';
import { FeatureContent } from './feature/FeatureContent';
import { FeatureTabs } from './feature/FeatureTabs';

interface ChecksterProps {
  checkOrCheckType?: Check | CheckType;
  // Resolve with a function if a call back should be made after the fact
  // that the check is saved (and the form knows everything when OK)
  // Example: when we want to navigate from the form after a successful save
  onSave(check: Check, formValues: CheckFormValues): Promise<Function | void>;
  onCheckTypeChange?(checkType: CheckType): void;
}

export function Checkster({ onSave, ...props }: ChecksterProps) {
  return (
    <InternalConditionalProvider {...props}>
      <ChecksterInternal onSave={onSave} />
    </InternalConditionalProvider>
  );
}

function ChecksterInternal({ onSave }: ChecksterProps) {
  const { isLoading, error } = useChecksterContext();
  const {
    formState: { isDirty },
  } = useFormContext();

  return (
    <>
      <AppContainer isLoading={isLoading} error={error}>
        <PrimaryLayoutSection headerContent={<FormSectionNavigation />}>
          <FormRoot onSave={onSave} />
        </PrimaryLayoutSection>
        <FeatureTabsContextProvider>
          <SecondaryLayoutSection headerContent={<FeatureTabs />}>
            <FeatureContent />
          </SecondaryLayoutSection>
        </FeatureTabsContextProvider>
      </AppContainer>
      {/* TODO: Do we want to use/keep this or just remove it? */}
      <ChooseCheckTypeModal isOpen={false} />
      <ConfirmLeavingPage enabled={isDirty} />
    </>
  );
}
