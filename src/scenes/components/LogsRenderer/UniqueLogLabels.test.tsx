import React from 'react';
import { render, screen } from '@testing-library/react';
import { LOG_LABELS_COMMON } from 'features/parseCheckLogs/checkLogs.constants.labels';
import { startingLogFactory, unknownExecutionLogFactory } from 'test/factories/executionLogs';

import { UniqueLogLabels } from 'scenes/components/LogsRenderer/UniqueLogLabels';

describe('UniqueLogLabels', () => {
  it('should render unique labels for a known log', () => {
    const timeoutSeconds = `10`;
    const beginningCheckLog = startingLogFactory.build({
      labels: {
        timeout_seconds: timeoutSeconds,
      },
    });

    render(<UniqueLogLabels log={beginningCheckLog} />);
    expect(screen.getByText(`timeout_seconds=${timeoutSeconds}`)).toBeInTheDocument();
  });

  it('should render unique labels for an unknown log', () => {
    const KEY = `some_unknown_key`;
    const VALUE = `some_unknown_value`;
    const unknownLog = unknownExecutionLogFactory.build({
      labels: {
        [KEY]: VALUE,
      },
    });

    render(<UniqueLogLabels log={unknownLog} />);
    expect(screen.getByText(`${KEY}=${VALUE}`)).toBeInTheDocument();
  });

  it(`should filter label keys that are suffixed with _extracted`, () => {
    const KEY = `some_key_extracted`;
    const VALUE = `some_value`;

    const log = unknownExecutionLogFactory.build({
      labels: {
        [KEY]: VALUE,
      },
    });

    render(<UniqueLogLabels log={log} />);
    expect(screen.queryByText(`${KEY}=${VALUE}`)).not.toBeInTheDocument();
  });

  it(`should filter label keys that are prefixed with label_`, () => {
    const KEY = `some_key_extracted`;
    const VALUE = `some_value`;

    const log = unknownExecutionLogFactory.build({
      labels: {
        [KEY]: VALUE,
      },
    });

    render(<UniqueLogLabels log={log} />);
    expect(screen.queryByText(`${KEY}=${VALUE}`)).not.toBeInTheDocument();
  });

  it(`should filter label keys that are in the default common labels`, () => {
    const KEY = LOG_LABELS_COMMON[0];

    const log = unknownExecutionLogFactory.build();
    const VALUE = log.labels[KEY];

    render(<UniqueLogLabels log={log} />);
    expect(log.labels[KEY]).toBeDefined();
    expect(screen.queryByText(`${KEY}=${VALUE}`)).not.toBeInTheDocument();
  });

  it(`should filter the msg label key`, () => {
    const KEY = `msg`;
    const VALUE = `some_value`;

    const log = unknownExecutionLogFactory.build({
      labels: {
        [KEY]: VALUE,
      },
    });

    render(<UniqueLogLabels log={log} />);
    expect(log.labels[KEY]).toBeDefined();
    expect(screen.queryByText(`${KEY}=${VALUE}`)).not.toBeInTheDocument();
  });
});
