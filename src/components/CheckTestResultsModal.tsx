import React from 'react';
import { Modal } from '@grafana/ui';

import { AdHocCheckResponse } from 'datasource/responses.types';
import { useProbes } from 'data/useProbes';
import { useCheckFormContext } from 'components/CheckForm/CheckFormContext/CheckFormContext';

interface Props {
  testResponse?: AdHocCheckResponse;
  isOpen: boolean;
  onDismiss: () => void;
}

export function CheckTestResultsModal({ testResponse, isOpen, onDismiss }: Props) {
  const { data: probes = [] } = useProbes();
  const { supportingContent } = useCheckFormContext();
  const { requests } = supportingContent;
  const latestRequest = requests[requests.length - 1];
  console.log({ testResponse, latestRequest });

  return (
    <Modal
      title="Test check"
      isOpen={isOpen}
      onDismiss={() => {
        onDismiss();
      }}
    >
      <p>Tests will run on up to 5 randomly selected probes</p>
      {testResponse?.probes.map((testProbe) => {
        const probe = probes.find((probe) => probe.id === testProbe);

        return (
          <div key={testProbe}>
            <p>{probe?.name}</p>
            <code>{JSON.stringify(latestRequest.data.result, null, 2)}</code>
          </div>
        );
      })}
    </Modal>
  );
}
