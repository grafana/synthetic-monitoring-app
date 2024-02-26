import React, { forwardRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Alert, Button, Modal } from '@grafana/ui';

import { Check, CheckFormValues, CheckType } from 'types';
import { checkType as getCheckType } from 'utils';
import { AdHocCheckResponse } from 'datasource/responses.types';
import { useTestCheck } from 'data/useChecks';

import { getCheckFromFormValues } from './CheckEditor/checkFormTransformations';
import { CheckTestResultsModal } from './CheckTestResultsModal';

interface Props {
  check: Check;
}

export const CheckTestButton = forwardRef<HTMLButtonElement, Props>(function CheckTestButton({ check }, ref) {
  const checkType = getCheckType(check.settings);
  const { mutate: testCheck } = useTestCheck({ eventInfo: { type: checkType } });
  const [isTestModalOpen, setTestModalOpen] = useState(false);
  const [isErrorModalOpen, setErrorModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [testResponse, setTestResponse] = useState<AdHocCheckResponse>();
  const [testRequestInFlight, setTestRequestInFlight] = useState(false);
  const formMethods = useFormContext<CheckFormValues>();

  return (
    <>
      <Button
        type="submit"
        variant="secondary"
        icon={testRequestInFlight ? `fa fa-spinner` : undefined}
        disabled={testRequestInFlight || checkType === CheckType.Traceroute}
        onClick={() => {
          const values = formMethods.getValues();
          const check = getCheckFromFormValues(values);
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
        ref={ref}
      >
        Test
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
});
