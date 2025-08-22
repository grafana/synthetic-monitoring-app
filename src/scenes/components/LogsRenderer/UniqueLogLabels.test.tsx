import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
