import React from 'react';
import { dateTimeFormat } from '@grafana/data';
import { render, screen, within } from '@testing-library/react';
import { executionLogsFactory } from 'test/factories/executionLogs';

import { LogsEvent } from './LogsEvent';

describe('LogsEvent', () => {
  it('should render all the logs correctly', () => {
    const MAIN_KEY = 'msg';
    const logs = executionLogsFactory.build(undefined, {
      transient: {
        commonLabels: {
          probe: 'test',
        },
      },
    });

    render(<LogsEvent logs={logs} mainKey={MAIN_KEY} />);
    const logLineElements = screen.getAllByTestId(/event-log-/);

    logLineElements.forEach((el, index) => {
      const renderedMainKey = within(el).getByText(logs[index].labels[MAIN_KEY]);
      const renderedLevel = within(el).getByText(logs[index].labels.level.toUpperCase());
      const expectedTime = dateTimeFormat(logs[index].Time, {
        defaultWithMS: true,
      });
      const logTime = within(el).getByText(expectedTime);

      expect(logTime).toBeInTheDocument();
      expect(renderedMainKey).toBeInTheDocument();
      expect(renderedLevel).toBeInTheDocument();
    });

    const beginningCheckLog = logLineElements[0];

    const beginningCheckLogTime = within(beginningCheckLog).getByText(
      `timeout_seconds=${logs[0].labels.timeout_seconds}`
    );

    expect(beginningCheckLogTime).toBeInTheDocument();
  });
});
