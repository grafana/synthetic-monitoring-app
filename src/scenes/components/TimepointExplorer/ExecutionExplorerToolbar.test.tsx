import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardAnnotationsStaticProvider } from 'dashboards/annotations/DashboardAnnotationsProvider';

import { ExecutionExplorerToolbar } from './ExecutionExplorerToolbar';

describe('ExecutionExplorerToolbar', () => {
  it('changes result scope and exposes inert future controls', async () => {
    const user = userEvent.setup();
    const onResultFilterChange = jest.fn();

    render(
      <ExecutionExplorerToolbar resultFilter="all" onResultFilterChange={onResultFilterChange} annotations={[]} />
    );

    await user.click(screen.getByRole('button', { name: 'Unsuccessful only' }));

    expect(onResultFilterChange).toHaveBeenCalledWith('unsuccessful');
    for (const name of ['Product context', 'Compare related checks', 'Advanced filters']) {
      const control = screen.getByRole('button', { name });
      expect(control).toBeDisabled();
      expect(control).toHaveAccessibleDescription('Coming later');
    }
  });

  it('renders enabled annotation events in the secondary row', () => {
    render(
      <DashboardAnnotationsStaticProvider
        value={{
          definitions: [{ name: 'Show alerts firing', enable: true, iconColor: 'red' }],
          enabledByName: { 'Show alerts firing': true },
          framesByName: {},
          frames: [],
          eventsByName: { 'Show alerts firing': [[100, 200], [300, 300]] },
          setEnabled: jest.fn(),
        }}
      >
        <ExecutionExplorerToolbar
          resultFilter="all"
          onResultFilterChange={jest.fn()}
          annotations={[{ name: 'Show alerts firing', enable: true, iconColor: 'red' }]}
        />
      </DashboardAnnotationsStaticProvider>
    );

    expect(screen.getAllByRole('button', { name: 'Annotation region' })).toHaveLength(2);
  });
});
