import React from 'react';
import { dateTime, TimeRange } from '@grafana/data';
import { config, usePluginComponent } from '@grafana/runtime';
import { screen, waitFor, within } from '@testing-library/react';
import { ROUTER_TEST_ID } from 'test/dataTestIds';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';
import { runTestAsSMViewer } from 'test/utils';

import { CheckNotebookAction } from './CheckNotebookAction';
import { ADD_TO_NOTEBOOK_COMPONENT_ID, AddToNotebookFormProps } from './checkNotebookContext';

let mockTimeRange: TimeRange;
let mockTimeZone: string;
let mockProbeValues: string[];
let mockProbesLoading: boolean;
let mockResolvedProbeFilter: string;

jest.mock('@grafana/scenes-react', () => ({
  ...jest.requireActual('@grafana/scenes-react'),
  useTimeRange: () => [mockTimeRange, { getTimeZone: () => mockTimeZone }],
  useVariableValues: () => [mockProbeValues, mockProbesLoading],
  useVariableInterpolator: () => () => mockResolvedProbeFilter,
}));

function NotebookForm({ cells, defaultTitle, onClose, onAdded }: AddToNotebookFormProps) {
  return (
    <>
      <h3>{defaultTitle}</h3>
      <pre>{JSON.stringify(cells)}</pre>
      <button type="button" onClick={onClose}>
        Cancel capture
      </button>
      <button type="button" onClick={() => onAdded?.({ uid: 'notebook', title: 'Notebook', url: '/notebook' })}>
        Complete capture
      </button>
    </>
  );
}

function grantNotebookPermission(permission: 'notebooks:create' | 'notebooks:write') {
  jest.replaceProperty(config.bootData.user, 'permissions', {
    ...config.bootData.user.permissions,
    [permission]: true,
  });
}

beforeEach(() => {
  mockTimeRange = {
    from: dateTime('2026-10-20T10:00:00Z'),
    to: dateTime('2026-10-20T11:00:00Z'),
    raw: { from: 'now-1h', to: 'now' },
  };
  mockTimeZone = 'America/Los_Angeles';
  mockProbeValues = ['London'];
  mockProbesLoading = false;
  mockResolvedProbeFilter = 'London';
  runTestAsSMViewer();
  grantNotebookPermission('notebooks:create');
  jest
    .mocked(usePluginComponent)
    .mockImplementation((id) =>
      id === ADD_TO_NOTEBOOK_COMPONENT_ID
        ? { component: NotebookForm as React.ComponentType, isLoading: false }
        : { component: null, isLoading: false }
    );
});

afterEach(() => {
  jest.mocked(usePluginComponent).mockReturnValue({ component: null, isLoading: false });
});

it.each([
  { component: null, isLoading: false },
  { component: null, isLoading: true },
  { component: NotebookForm as React.ComponentType, isLoading: true },
])('hides the action when the host extension is unavailable or loading: %j', async (extension) => {
  jest.mocked(usePluginComponent).mockReturnValue(extension);
  render(<CheckNotebookAction check={BASIC_HTTP_CHECK} />);

  await screen.findByTestId(ROUTER_TEST_ID.info);
  expect(screen.queryByRole('button', { name: 'Check actions' })).not.toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('hides the action without notebook permissions even if the user can view the check', async () => {
  runTestAsSMViewer();
  render(<CheckNotebookAction check={BASIC_HTTP_CHECK} />);

  await screen.findByTestId(ROUTER_TEST_ID.info);
  expect(screen.queryByRole('button', { name: 'Check actions' })).not.toBeInTheDocument();
});

it('hides the action while probe filters are unresolved', async () => {
  mockProbesLoading = true;
  render(<CheckNotebookAction check={BASIC_HTTP_CHECK} />);

  await screen.findByTestId(ROUTER_TEST_ID.info);
  expect(screen.queryByRole('button', { name: 'Check actions' })).not.toBeInTheDocument();
});

it.each(['notebooks:create', 'notebooks:write'] as const)(
  'allows %s independently of check-edit permissions and opens the host form in a modal',
  async (permission) => {
    runTestAsSMViewer();
    grantNotebookPermission(permission);
    const { user } = render(<CheckNotebookAction check={BASIC_HTTP_CHECK} />);

    await user.click(await screen.findByRole('button', { name: 'Check actions' }));
    await user.click(await screen.findByRole('menuitem', { name: /Add to notebook/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Add check context to notebook' });
    expect(
      within(dialog).getByRole('heading', { name: `Synthetic Monitoring: ${BASIC_HTTP_CHECK.job}` })
    ).toBeVisible();
    expect(dialog).toHaveTextContent('Context only — no chart');
    expect(dialog).not.toHaveTextContent(BASIC_HTTP_CHECK.target);
  }
);

it('freezes context at opening, including mutable check, time, timezone and probe values, then refreshes on reopening', async () => {
  const check = { ...BASIC_HTTP_CHECK };
  const { user, rerender } = render(<CheckNotebookAction check={check} />);
  await user.click(await screen.findByRole('button', { name: 'Check actions' }));
  await user.click(await screen.findByRole('menuitem', { name: /Add to notebook/ }));
  const original = (await screen.findByRole('dialog')).textContent;

  check.job = 'Changed check';
  mockTimeRange.raw.from = 'now-6h';
  mockTimeRange.from = dateTime('2026-10-20T05:00:00Z');
  mockTimeZone = 'utc';
  mockProbeValues.push('Paris');
  mockResolvedProbeFilter = '(London|Paris)';
  rerender(<CheckNotebookAction check={check} />);

  expect(screen.getByRole('dialog').textContent).toBe(original);
  await user.click(screen.getByRole('button', { name: 'Cancel capture' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: 'Check actions' }));
  await user.click(await screen.findByRole('menuitem', { name: /Add to notebook/ }));

  const reopened = await screen.findByRole('dialog');
  expect(reopened).toHaveTextContent('Changed check');
  expect(reopened).toHaveTextContent('Paris');
  expect(reopened).toHaveTextContent('now\\\\-6h');
  expect(reopened).not.toHaveTextContent('America/Los');
});

it.each(['Cancel capture', 'Complete capture', 'Close'])('closes the modal through %s', async (button) => {
  const { user } = render(<CheckNotebookAction check={BASIC_HTTP_CHECK} />);
  await user.click(await screen.findByRole('button', { name: 'Check actions' }));
  await user.click(await screen.findByRole('menuitem', { name: /Add to notebook/ }));
  await screen.findByRole('dialog');
  await user.click(screen.getByRole('button', { name: button }));

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
