import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { Check, CheckFormValues } from '../../types';
import { CheckInstrumentation } from './types';

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
  check?: Check | CheckInstrumentation;
  onSave(check: Check, formValues: CheckFormValues): Promise<void>;
}

export function Checkster(props: ChecksterProps) {
  return (
    <InternalConditionalProvider>
      <ChecksterInternal {...props} />
    </InternalConditionalProvider>
  );
}

function ChecksterInternal({ check, onSave }: ChecksterProps) {
  const { setCheck, isLoading, error } = useChecksterContext();
  const {
    formState: { isDirty },
  } = useFormContext();
  useEffect(() => {
    setCheck(check);
  }, [check, setCheck]);

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
