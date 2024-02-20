import React, { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Alert, Button, Modal } from '@grafana/ui';

import { Check, CheckFormValues, CheckType } from 'types';
import { checkType as getCheckType } from 'utils';
import { AdHocCheckResponse } from 'datasource/responses.types';
import { useTestCheck } from 'data/useChecks';

import { getCheckFromFormValues, getDefaultValuesFromCheck } from './CheckEditor/checkFormTransformations';
import { CheckTestResultsModal } from './CheckTestResultsModal';

interface Props {
  check: Check;
}

export function CheckTestButton({ check }: Props) {
  const checkType = getCheckType(check.settings);
  const { mutate: testCheck } = useTestCheck({ eventInfo: { type: checkType } });
  const [isTestModalOpen, setTestModalOpen] = useState(false);
  const [isErrorModalOpen, setErrorModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [testResponse, setTestResponse] = useState<AdHocCheckResponse>();
  const [testRequestInFlight, setTestRequestInFlight] = useState(false);
  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);
  const formMethods = useFormContext();

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        icon={testRequestInFlight ? `fa fa-spinner` : undefined}
        disabled={testRequestInFlight || checkType === CheckType.Traceroute}
        onClick={() => {
          const values = formMethods.getValues() as CheckFormValues;
          const check = getCheckFromFormValues(values, defaultValues, checkType);
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
}
