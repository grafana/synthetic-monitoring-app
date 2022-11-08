import { dateTime } from '@grafana/data';
import { Modal, Spinner } from '@grafana/ui';
import { InstanceContext } from 'contexts/InstanceContext';
import { useLogData } from 'hooks/useLogData';
import React, { useState, useEffect, useContext } from 'react';
import { AdHocCheckResponse, Probe } from 'types';
import { CheckTestResult } from './CheckTestResult';

interface Props {
  testResponse?: AdHocCheckResponse;
  isOpen: boolean;
  onDismiss: () => void;
}

export function CheckTestResultsModal({ testResponse, isOpen, onDismiss }: Props) {
  const { instance } = useContext(InstanceContext);
  const query = `{type="adhoc"} |= "${testResponse?.id}"`;
  const [now] = useState(Date.now());
  const [resultsByProbe, setResultsByProbe] = useState<Record<string, any>>({});
  const [probes, setProbes] = useState<Probe[]>();
  const start = dateTime(now).subtract(5, 'm');
  const end = dateTime(now);
  const { data } = useLogData(query, { start, end, skip: !testResponse || !isOpen });

  useEffect(() => {
    const abortController = new AbortController();
    const fetchProbes = async () => {
      const probes = await instance.api?.listProbes();
      console.log('fetching probes', probes, abortController.signal.aborted);
      if (!abortController.signal.aborted) {
        setProbes(probes ?? []);
      }
    };

    fetchProbes();
    return () => abortController.abort();
  }, [instance]);

  if (testResponse) {
    data.forEach((item) => {
      const logsStr = item.values?.[0]?.[1];
      try {
        const info = JSON.parse(logsStr);
        if (!resultsByProbe[`${info.probe}${testResponse.id}`] && info.id === testResponse.id) {
          setResultsByProbe({ ...resultsByProbe, [`${info.probe}${testResponse.id}`]: info });
        }
      } catch (e) {
        console.log('error parsing', e);
      }
    });
  }

  return (
    <Modal
      title="Test check"
      isOpen={isOpen}
      onDismiss={() => {
        console.log('clearing results');
        setResultsByProbe({});
        onDismiss();
      }}
    >
      {testResponse?.probes.map((testProbe) => {
        const probe = probes?.find((probe) => probe.id === testProbe);
        const resultKey = `${probe?.name}${testResponse.id}`;
        const result = resultsByProbe[resultKey];
        const successMetric = result?.timeseries.find((timeseries: any) => timeseries.name === 'probe_success');
        const success = successMetric?.metric?.[0]?.gauge?.value;

        console.log({ testProbe, testResponse, probe, probes, result, successMetric, success, resultsByProbe });

        return (
          <CheckTestResult
            key={testProbe}
            probeName={probe?.name ?? ''}
            success={success}
            loading={!result}
            start={start}
            end={end}
            logs={result?.logs}
          />
        );
      }) ?? <Spinner />}
    </Modal>
  );
}
