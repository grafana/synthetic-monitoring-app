import React, { useEffect, useState } from 'react';
import { ArrayVector, dateTime, FieldType } from '@grafana/data';
import { Modal, Spinner } from '@grafana/ui';

import { AdHocCheckResponse } from 'datasource/responses.types';
import { useProbes } from 'data/useProbes';
import { useLogData } from 'hooks/useLogData';

import { CheckTestResult } from './CheckTestResult';

interface Props {
  testResponse?: AdHocCheckResponse;
  isOpen: boolean;
  onDismiss: () => void;
}

function buildLogsDf(logs: Array<Record<string, any>>) {
  const tsValues = new Array(logs?.length).fill(Date.now());
  const fields: Record<string, any> = {
    // a timestamp is required for the panel to render. we don't care about/have a timestamp so we just fill with the time for right now
    ts: {
      name: 'ts',
      type: FieldType.time,
      config: { displayName: 'Time' },
      values: new ArrayVector(tsValues),
    },
  };
  // We need to loop through all the logs and build up a complete list of fields.
  logs.forEach((log, index) => {
    Object.keys(log).forEach((fieldName) => {
      if (!fields[fieldName]) {
        const values = new Array(logs.length).fill(undefined);
        values[index] = log[fieldName];
        fields[fieldName] = {
          name: fieldName,
          type: FieldType.string,
          values: new ArrayVector(values),
          config: {},
        };
      } else {
        fields[fieldName].values.set(index, log[fieldName]);
      }
    });
  });
  const dataframe = {
    refId: 'A',
    // the first string field is what gets displayed as the log line. We want that to be the 'msg' field
    fields: Object.keys(fields)
      .sort((a, b) => {
        if (a === 'msg') {
          return -1;
        }
        if (b === 'msg') {
          return 1;
        }
        return 0;
      })
      .map((fieldName) => fields[fieldName]),
    length: logs.length,
  };
  return dataframe;
}

export function CheckTestResultsModal({ testResponse, isOpen, onDismiss }: Props) {
  const query = `{type="adhoc"} |= "${testResponse?.id}"`;
  const [now] = useState(Date.now());
  const [resultsByProbe, setResultsByProbe] = useState<Record<string, any>>({});
  const start = dateTime(now).subtract(5, 'm');
  const end = dateTime(now);
  const { data } = useLogData(query, { start, end, skip: !testResponse || !isOpen });
  const { data: probes = [] } = useProbes();

  // This effect is to handle the whole test taking longer than 30 seconds. It checks for any probes that haven't given a response and fills in a fake metrics/logs response that indicates a failure.
  useEffect(() => {
    let timeoutId: any;
    if (testResponse && probes.length) {
      timeoutId = setTimeout(() => {
        const resultCount = Object.keys(resultsByProbe).filter((key) => key.includes(testResponse.id)).length;
        const hasResultsForAllProbes = resultCount === testResponse.probes.length;
        if (!hasResultsForAllProbes) {
          const resultsToUpdate: Record<string, any> = {};
          testResponse.probes.forEach((probeId) => {
            const probe = probes?.find((probe) => probe.id === probeId);
            if (probe) {
              const resultKey = `${probe.name}${testResponse.id}`;
              if (!resultsByProbe[resultKey]) {
                const df = buildLogsDf([{ level: 'error', msg: 'timed out waiting for a response' }]);
                const info = {
                  logs: df,
                  timeseries: [{ name: 'probe_success', metric: [{ gauge: { value: 0 } }] }],
                };
                resultsToUpdate[resultKey] = info;
              }
            }
          });
          setResultsByProbe({ ...resultsByProbe, ...resultsToUpdate });
        }
      }, 30000);
    }
    return () => clearTimeout(timeoutId);
  }, [testResponse, probes, resultsByProbe]);

  if (testResponse) {
    data.forEach((item) => {
      const logsStr = item.values?.[0]?.[1];
      try {
        const info = JSON.parse(logsStr);
        let df;
        if (!info.logs) {
          df = buildLogsDf([{ level: 'error', msg: 'There was an error running the test' }]);
        } else {
          df = buildLogsDf(info.logs);
        }
        info.logs = df;
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
        setResultsByProbe({});
        onDismiss();
      }}
    >
      <p>Tests will run on up to 5 randomly selected probes</p>
      {testResponse?.probes.map((testProbe) => {
        const probe = probes.find((probe) => probe.id === testProbe);
        const resultKey = `${probe?.name}${testResponse.id}`;
        const result = resultsByProbe[resultKey];
        const successMetric = result?.timeseries.find((timeseries: any) => timeseries.name === 'probe_success');
        const success = successMetric?.metric?.[0]?.gauge?.value;

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
