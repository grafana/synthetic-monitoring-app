import React, { useEffect } from 'react';

import { Check } from '../../types';
import { CheckInstrumentation } from './types';

import { ContextDebugger } from './components/ContextDebugger';
import { FormRoot } from './components/form/FormRoot';
import { FormSectionNavigation } from './components/FormSectionNavigation/FormSectionNavigation';
import { ChooseCheckTypeModal } from './components/modals/ChooseCheckTypeModal';
import { AppContainer } from './components/ui/AppContainer';
import { PrimaryLayoutSection } from './components/ui/PrimaryLayoutSection';
import { SecondaryLayoutSection } from './components/ui/SecondaryLayoutSection';
import { InternalConditionalProvider, useChecksterContext } from './contexts/ChecksterContext';

interface ChecksterProps {
  check?: Check | CheckInstrumentation;
  onSave(check: Check): Promise<void>;
}

export function Checkster(props: ChecksterProps) {
  return (
    <InternalConditionalProvider>
      <ChecksterInternal {...props} />
    </InternalConditionalProvider>
  );
}

function ChecksterInternal({ check }: ChecksterProps) {
  const { setCheck, isLoading, error } = useChecksterContext();

  useEffect(() => {
    setCheck(check);
    console.log('Checkster received check prop:', check);
  }, [check, setCheck]);

  return (
    <>
      <AppContainer isLoading={isLoading} error={error}>
        <PrimaryLayoutSection headerContent={<FormSectionNavigation />}>
          <FormRoot />
        </PrimaryLayoutSection>
        <SecondaryLayoutSection headerContent={null}>
          <ContextDebugger />
        </SecondaryLayoutSection>
      </AppContainer>
      <ChooseCheckTypeModal isOpen={false} />
    </>
  );
}
