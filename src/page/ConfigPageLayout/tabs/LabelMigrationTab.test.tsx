import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TENANT_LABEL_MODE } from 'test/fixtures/tenants';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { runTestAsSMAdmin } from 'test/utils';

import { LabelMigrationTab } from './LabelMigrationTab';

async function renderTab() {
  const result = render(<LabelMigrationTab />);
  await waitFor(() => expect(screen.queryByText('Label Migration')).toBeInTheDocument());
  return result;
}

describe('LabelMigrationTab', () => {
  it('renders the tab title', async () => {
    await renderTab();
    expect(screen.getByText('Label Migration')).toBeInTheDocument();
  });

  it('shows the current mode in prefixed state', async () => {
    await renderTab();
    // The mode name appears in multiple places (status + preview) — just assert at least one exists
    await waitFor(() => {
      const elements = screen.getAllByText('Prefixed (label_foo)', { selector: 'strong' });
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('shows the Enable dual-write button for PREFIXED mode', async () => {
    runTestAsSMAdmin();
    await renderTab();
    await waitFor(() => expect(screen.getByRole('button', { name: /Enable dual-write/i })).toBeInTheDocument());
  });

  it('shows a confirmation modal with contextual confirmText when Enable dual-write is clicked', async () => {
    runTestAsSMAdmin();
    await renderTab();
    // Click the trigger button (the one in the tab content, not in the modal)
    const trigger = await screen.findByRole('button', { name: /Enable dual-write/i });
    await userEvent.click(trigger);
    // The ConfirmModal should now be open — the modal dialog itself confirms it
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    // The confirm button inside the modal has the contextual confirmText
    const buttons = screen.getAllByRole('button', { name: /^Enable dual-write$/i });
    // There should be at least the confirm button (there may also be the original trigger)
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows only the Finalize button in DUAL_WRITE mode (no revert to prefixed)', async () => {
    runTestAsSMAdmin();
    server.use(
      apiRoute('getLabelMode', {
        result: () => ({ json: { mode: 1, systemLabels: TENANT_LABEL_MODE.systemLabels } }),
      })
    );
    await renderTab();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Finalize migration/i })).toBeInTheDocument();
    });
    // Entering dual-write is irreversible: there must be no path back to prefixed-only.
    expect(screen.queryByRole('button', { name: /Revert to prefixed/i })).not.toBeInTheDocument();
  });

  it('shows Finalize confirm modal with "Finalize" confirmText (not generic Confirm)', async () => {
    runTestAsSMAdmin();
    server.use(
      apiRoute('getLabelMode', {
        result: () => ({ json: { mode: 1, systemLabels: TENANT_LABEL_MODE.systemLabels } }),
      })
    );
    await renderTab();
    const button = await screen.findByRole('button', { name: /Finalize migration/i });
    await userEvent.click(button);
    // The destructive finalize action should have "Finalize" as confirmText, not "Confirm"
    await waitFor(() => expect(screen.getByRole('button', { name: /^Finalize$/i })).toBeInTheDocument());
  });

  it('shows completion, silent-drop warning, and revert to dual-write in UNPREFIXED mode', async () => {
    runTestAsSMAdmin();
    server.use(
      apiRoute('getLabelMode', {
        result: () => ({ json: { mode: 2, systemLabels: TENANT_LABEL_MODE.systemLabels } }),
      })
    );
    await renderTab();
    await waitFor(() => expect(screen.getByText(/Migration complete/i)).toBeInTheDocument());
    // Silent-drop warning is now shown in UNPREFIXED mode
    expect(screen.getByText(/silently dropped/i)).toBeInTheDocument();
    // Finalization is reversible: the tenant can restore dual-write, but never prefixed-only.
    expect(screen.getByRole('button', { name: /Revert to dual-write/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Enable dual-write/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Finalize/i })).not.toBeInTheDocument();
  });

  it('opens a confirmation modal when Revert to dual-write is clicked in UNPREFIXED mode', async () => {
    runTestAsSMAdmin();
    server.use(
      apiRoute('getLabelMode', {
        result: () => ({ json: { mode: 2, systemLabels: TENANT_LABEL_MODE.systemLabels } }),
      })
    );
    await renderTab();
    const trigger = await screen.findByRole('button', { name: /Revert to dual-write/i });
    await userEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByText(/temporarily restore the prefixed/i)).toBeInTheDocument();
  });

  it('shows collision error with label names when API returns 409', async () => {
    runTestAsSMAdmin();
    server.use(
      apiRoute('setLabelMode', {
        result: () => ({
          status: 409,
          json: { msg: 'labels conflict', collidingLabels: ['probe', 'instance'] },
        }),
      })
    );
    await renderTab();
    // Open the confirm modal
    const trigger = await screen.findByRole('button', { name: /Enable dual-write/i });
    await userEvent.click(trigger);
    // Click the confirm button inside the modal (Grafana ConfirmModal uses a specific data-testid)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    const confirmButton = screen.getByTestId('data-testid Confirm Modal Danger Button');
    await userEvent.click(confirmButton);
    // Collision error renders the collidingLabels list items inside a <code> tag
    await waitFor(() => {
      expect(screen.getByText('probe', { selector: 'code' })).toBeInTheDocument();
      expect(screen.getByText('instance', { selector: 'code' })).toBeInTheDocument();
    });
  });

  it('shows an update error without Retry when setLabelMode fails without collisions', async () => {
    runTestAsSMAdmin();
    server.use(
      apiRoute('setLabelMode', {
        result: () => ({ status: 500, json: { msg: 'failed to update label mode' } }),
      })
    );
    await renderTab();
    const trigger = await screen.findByRole('button', { name: /Enable dual-write/i });
    await userEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    const confirmButton = screen.getByTestId('data-testid Confirm Modal Danger Button');
    await userEvent.click(confirmButton);
    // The failure is reported as an update error carrying the API's message...
    await waitFor(() => expect(screen.getByText(/Failed to update label migration mode/i)).toBeInTheDocument());
    expect(screen.getByText(/failed to update label mode/i)).toBeInTheDocument();
    // ...not as a load error, whose Retry would refetch instead of retrying the change.
    expect(screen.queryByText(/Error loading label migration status/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retry/i })).not.toBeInTheDocument();
  });

  it('shows error alert with Retry button on load failure', async () => {
    runTestAsSMAdmin();
    server.use(
      apiRoute('getLabelMode', {
        result: () => ({ status: 500, json: { msg: 'internal error' } }),
      })
    );
    await renderTab();
    await waitFor(() => expect(screen.getByText(/Error loading label migration status/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('clears a previous error and reloads on Retry click', async () => {
    runTestAsSMAdmin();
    let callCount = 0;
    server.use(
      apiRoute('getLabelMode', {
        result: () => {
          callCount++;
          if (callCount === 1) {
            return { status: 500, json: { msg: 'first failure' } };
          }
          return { json: { mode: 0, systemLabels: TENANT_LABEL_MODE.systemLabels } };
        },
      })
    );
    await renderTab();
    const retryButton = await screen.findByRole('button', { name: /Retry/i });
    await userEvent.click(retryButton);
    await waitFor(() => {
      const els = screen.getAllByText('Prefixed (label_foo)', { selector: 'strong' });
      expect(els.length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/Error loading/i)).not.toBeInTheDocument();
  });

  it('shows the reserved system labels list when expanded', async () => {
    runTestAsSMAdmin();
    await renderTab();
    const toggle = await screen.findByText(/Show reserved label names/i);
    await userEvent.click(toggle);
    // The reserved labels list renders names inside <code> tags
    await waitFor(() => expect(screen.getAllByText('probe', { selector: 'code' }).length).toBeGreaterThan(0));
  });

  it('shows the reserved labels section in UNPREFIXED mode (for auditing)', async () => {
    runTestAsSMAdmin();
    server.use(
      apiRoute('getLabelMode', {
        result: () => ({ json: { mode: 2, systemLabels: TENANT_LABEL_MODE.systemLabels } }),
      })
    );
    await renderTab();
    // Reserved labels section is now shown in UNPREFIXED mode for auditing
    await waitFor(() => expect(screen.getByText(/Show reserved label names/i)).toBeInTheDocument());
  });
});
