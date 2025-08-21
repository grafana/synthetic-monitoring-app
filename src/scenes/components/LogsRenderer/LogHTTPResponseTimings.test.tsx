import React from 'react';
import { render } from '@testing-library/react';
import { unknownExecutionLogFactory } from 'test/db/checkLogs';

import { LogHTTPResponseTimings } from './LogHTTPResponseTimings';

describe('LogHTTPResponseTimings', () => {
  it('should render', () => {
    const log = unknownExecutionLogFactory.build();

    render(<LogHTTPResponseTimings log={log} />);
  });
});
