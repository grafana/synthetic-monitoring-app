import React, { useContext, useMemo, useState } from 'react';
import { Button, Spinner } from '@grafana/ui';
import { CheckTestResultsModal } from './CheckTestResultsModal';
import { AdHocCheckResponse, Check, CheckFormValues, CheckType } from 'types';
import { useFormContext } from 'react-hook-form';
import { getCheckFromFormValues, getDefaultValuesFromCheck } from './CheckEditor/checkFormTransformations';
import { FaroEvent, reportEvent } from 'faro';
import { checkType as getCheckType } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';

interface Props {
  check: Check;
}

export function CheckTestButton({ check }: Props) {
  const [isTestModalOpen, setTestModalOpen] = useState(false);
  const [testResponse, setTestResponse] = useState<AdHocCheckResponse>();
  const [testRequestInFlight, setTestRequestInFlight] = useState(false);
  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);
  const formMethods = useFormContext();
  const checkType = getCheckType(check.settings);
  const { instance } = useContext(InstanceContext);
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        disabled={testRequestInFlight || checkType === CheckType.Traceroute}
        onClick={() => {
          const values = formMethods.getValues() as CheckFormValues;
          const check = getCheckFromFormValues(values, defaultValues, checkType);
          reportEvent(FaroEvent.TEST_CHECK, { type: checkType });
          setTestRequestInFlight(true);
          instance?.api
            ?.testCheck(check)
            .then((resp) => {
              setTestModalOpen(true);
              setTestResponse(resp);
            })
            .finally(() => {
              setTestRequestInFlight(false);
            });
        }}
      >
        {testRequestInFlight ? <Spinner /> : 'Test'}
      </Button>
      <CheckTestResultsModal
        isOpen={isTestModalOpen}
        onDismiss={() => {
          setTestModalOpen(false);
          setTestResponse(undefined);
        }}
        testResponse={testResponse}
      />
    </>
  );
}
