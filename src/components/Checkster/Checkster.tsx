import React, { useEffect } from 'react';

import { Check, CheckFormValues } from '../../types';
import { CheckInstrumentation } from './types';

import { FormRoot } from './components/form/FormRoot';
import { FormSectionNavigation } from './components/FormSectionNavigation/FormSectionNavigation';
import { ChooseCheckTypeModal } from './components/modals/ChooseCheckTypeModal';
import { AppContainer } from './components/ui/AppContainer';
import { PrimaryLayoutSection } from './components/ui/PrimaryLayoutSection';
import { SecondaryLayoutSection } from './components/ui/SecondaryLayoutSection';
import { InternalConditionalProvider, useChecksterContext } from './contexts/ChecksterContext';
import { RightAside as AdHocCheckRightAside } from './feature/adhoc-check/RightAside';

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

  useEffect(() => {
    setCheck(check);
    console.log('Checkster received check prop:', check);
  }, [check, setCheck]);

  return (
    <>
      <AppContainer isLoading={isLoading} error={error}>
        <PrimaryLayoutSection headerContent={<FormSectionNavigation />}>
          <FormRoot onSave={onSave} />
        </PrimaryLayoutSection>
        <SecondaryLayoutSection headerContent={null}>
          <AdHocCheckRightAside />
        </SecondaryLayoutSection>
      </AppContainer>
      <ChooseCheckTypeModal isOpen={false} />
    </>
  );
}
