import React from 'react';
import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { DashboardHeader } from './DashboardHeader';

jest.mock('@grafana/scenes-react', () => ({
  VariableControl: () => <div data-testid="variable-control" />,
  RefreshPicker: () => <div data-testid="refresh-picker" />,
  TimeRangePicker: () => <div data-testid="time-range-picker" />,
}));

jest.mock('./DashboardAnnotationControls', () => ({
  DashboardAnnotationControls: () => <div data-testid="annotation-controls" />,
}));

jest.mock('./EditCheckButton', () => ({
  EditCheckButton: () => <button type="button">Edit check</button>,
}));

jest.mock('./SLOIntegration', () => ({
  SLOIntegration: ({ check }: { check: { id: number } }) => (
    <div data-testid="slo-integration">SLOIntegration for {check.id}</div>
  ),
}));

describe('DashboardHeader', () => {
  it('renders SLOIntegration for the check', async () => {
    render(<DashboardHeader annotations={[]} check={BASIC_HTTP_CHECK} />);

    expect(await screen.findByTestId('slo-integration')).toHaveTextContent(
      `SLOIntegration for ${BASIC_HTTP_CHECK.id}`
    );
  });
});
