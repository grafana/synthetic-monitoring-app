import { dateTime } from '@grafana/data';
import { Modal } from '@grafana/ui';
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
  const start = dateTime(now).subtract(5, 'm');
  const end = dateTime(now);
  const { data } = useLogData(query, { start, end, skip: !testResponse || !isOpen });
  // const thing =

  console.log(data);

  const logsStr = data?.[0]?.values?.[0]?.[1];
  let info;
  if (logsStr) {
    try {
      info = JSON.parse(logsStr);
    } catch (e) {
      console.log('error parsing', e);
    }
  }
  console.log(logsStr, info);
  return (
    <Modal title="Test check" isOpen={isOpen} onDismiss={onDismiss}>
      {testResponse?.target}
      {info?.logs?.map((log: string, index: number) => {
        return <div key={index}>log line: {log?.msg}</div>;
      })}
    </Modal>
  );
}
