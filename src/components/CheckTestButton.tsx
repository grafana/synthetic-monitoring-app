import React, { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Alert, Button, Modal, Spinner } from '@grafana/ui';

import { Check, CheckFormValues, CheckType } from 'types';
import { FaroEvent, reportEvent } from 'faro';
import { checkType as getCheckType } from 'utils';
import { AdHocCheckResponse } from 'datasource/responses.types';
import { useTestCheck } from 'data/useChecks';

import { getCheckFromFormValues, getDefaultValuesFromCheck } from './CheckEditor/checkFormTransformations';
import { CheckTestResultsModal } from './CheckTestResultsModal';

interface Props {
  check: Check;
}

export function CheckTestButton({ check }: Props) {
  const { mutate: testCheck } = useTestCheck();
  const [isTestModalOpen, setTestModalOpen] = useState(false);
  const [isErrorModalOpen, setErrorModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [testResponse, setTestResponse] = useState<AdHocCheckResponse>();
  const [testRequestInFlight, setTestRequestInFlight] = useState(false);
  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);
  const formMethods = useFormContext();
  const checkType = getCheckType(check.settings);

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
          testCheck(check, {
            onSuccess: (resp) => {
              setTestModalOpen(true);
              setTestResponse(resp);
              setTestRequestInFlight(false);
            },
            onError: (e) => {
              setErrorModalOpen(true);
              setError(e.message);
              setTestRequestInFlight(false);
            },
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
      <Modal
        isOpen={isErrorModalOpen}
        title="Error testing check"
        onDismiss={() => {
          setErrorModalOpen(false);
          setError('');
        }}
      >
        <Alert severity="error" title="Something went wrong running the check">
          {error}
        </Alert>
      </Modal>
    </>
  );
}
