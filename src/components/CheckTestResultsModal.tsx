import { dateTime } from '@grafana/data';
import { Icon, Modal } from '@grafana/ui';
import { useLogData } from 'hooks/useLogData';
import React, { useState } from 'react';
import { AdHocCheckResponse } from 'types';

interface Props {
  testResponse?: AdHocCheckResponse;
  isOpen: boolean;
  onDismiss: () => void;
}

export function CheckTestResultsModal({ testResponse, isOpen, onDismiss }: Props) {
  console.log('hello', testResponse?.id);
  const query = `{type="adhoc"} |= "${testResponse?.id}"`;
  const [now] = useState(Date.now());
  const [resultsByProbe, setResultsByProbe] = useState<Record<string, any>>({});
  const start = dateTime(now).subtract(5, 'm');
  const end = dateTime(now);
  const { data } = useLogData(query, { start, end, skip: !testResponse || !isOpen });

  data.forEach((item) => {
    const logsStr = item.values?.[0]?.[1];
    try {
      const info = JSON.parse(logsStr);
      if (!resultsByProbe[info.probe]) {
        setResultsByProbe({ ...resultsByProbe, [info.probe]: info });
      }
    } catch (e) {
      console.log('error parsing', e);
    }
  });

  console.log(resultsByProbe);

  return (
    <Modal title="Test check" isOpen={isOpen} onDismiss={onDismiss}>
      {testResponse?.target}
      {Object.entries(resultsByProbe).map(([probe, results]) => {
        console.log(results);
        const successMetric = results.timeseries.find((timeseries) => timeseries.name === 'probe_success');
        const success = successMetric?.metric?.[0]?.gauge?.value;

        return (
          <div key={probe}>
            Probe: {probe} <Icon name={success ? 'check-circle' : 'x'} />
            <br />
            Lines:{' '}
            {results.logs.map((log: any, index: number) => {
              return <div key={index}>{log.msg}</div>;
            })}
          </div>
        );
      })}
    </Modal>
  );
}
