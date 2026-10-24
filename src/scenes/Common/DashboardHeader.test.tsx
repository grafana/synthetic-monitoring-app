import React from 'react';
import { config, usePluginComponent } from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { ADD_TO_NOTEBOOK_COMPONENT_ID, AddToNotebookFormProps } from './checkNotebookContext';
import { DashboardHeader } from './DashboardHeader';

jest.mock('@grafana/scenes-react', () => {
  const { dateTime } = jest.requireActual('@grafana/data');
  return {
    useTimeRange: () => [
      {
        from: dateTime('2026-10-20T10:00:00Z'),
        to: dateTime('2026-10-20T11:00:00Z'),
        raw: { from: 'now-1h', to: 'now' },
      },
      { getTimeZone: () => 'utc' },
    ],
    useVariableValues: () => [['London'], false],
    useVariableInterpolator: () => () => 'London',
    VariableControl: () => <div data-testid="variable-control" />,
    RefreshPicker: () => <div data-testid="refresh-picker" />,
  };
});

jest.mock('./SceneTimeRangePicker', () => ({
  SceneTimeRangePicker: () => <div data-testid="time-range-picker" />,
}));

jest.mock('features/knowledgeGraph/KnowledgeGraphInsights', () => ({
  CheckKnowledgeGraphInsights: () => null,
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
  afterEach(() => {
    jest.mocked(usePluginComponent).mockReturnValue({ component: null, isLoading: false });
  });

  it('renders SLOIntegration for the check', async () => {
    render(<DashboardHeader annotations={[]} check={BASIC_HTTP_CHECK} />);

    expect(await screen.findByTestId('slo-integration')).toHaveTextContent(`SLOIntegration for ${BASIC_HTTP_CHECK.id}`);
  });

  it('opens selected-check context from the header action menu without replacing existing controls', async () => {
    jest.replaceProperty(config.bootData.user, 'permissions', {
      ...config.bootData.user.permissions,
      'notebooks:write': true,
    });
    const Form = ({ cells }: AddToNotebookFormProps) => <pre>{cells[0].text}</pre>;
    jest
      .mocked(usePluginComponent)
      .mockImplementation((id) =>
        id === ADD_TO_NOTEBOOK_COMPONENT_ID
          ? { component: Form as React.ComponentType, isLoading: false }
          : { component: null, isLoading: false }
      );
    const { user } = render(<DashboardHeader annotations={[]} check={BASIC_HTTP_CHECK} />);

    const actions = await screen.findByRole('button', { name: 'Check actions' });
    expect(screen.getByRole('button', { name: 'Edit check' })).toBeInTheDocument();
    expect(screen.getByTestId('time-range-picker')).toBeInTheDocument();
    await user.click(actions);
    await user.click(await screen.findByRole('menuitem', { name: /Add to notebook/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Add check context to notebook' });
    expect(dialog).toHaveTextContent(BASIC_HTTP_CHECK.job);
    expect(dialog).toHaveTextContent('Probe filter (resolved): London');
  });
});
