import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TENANT, TENANT_LABEL_MODE } from 'test/fixtures/tenants';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { runTestAsSMAdmin, runTestAsSMViewer } from 'test/utils';

import { queryInstantMetric } from 'data/utils';

import { LabelMigrationTab } from './LabelMigrationTab';

jest.mock('data/utils', () => ({
  ...jest.requireActual('data/utils'),
  queryInstantMetric: jest.fn(() => Promise.reject(new Error('no live metrics in tests'))),
}));

const queryInstantMetricMock = queryInstantMetric as jest.Mock;

async function renderTab() {
  const result = render(<LabelMigrationTab />);
  await waitFor(() => expect(screen.queryByText('Label migration')).toBeInTheDocument());
  return result;
}

describe('LabelMigrationTab', () => {
  it('renders the tab title', async () => {
    await renderTab();
    expect(screen.getByText('Label migration')).toBeInTheDocument();
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

  it('shows completion, enforcement notice, and revert to dual-write in UNPREFIXED mode', async () => {
    runTestAsSMAdmin();
    server.use(
      apiRoute('getLabelMode', {
        result: () => ({ json: { mode: 2, systemLabels: TENANT_LABEL_MODE.systemLabels } }),
      })
    );
    await renderTab();
    await waitFor(() => expect(screen.getByText(/Migration complete/i)).toBeInTheDocument());
    // Reserved names are rejected at write time once enforcement is active;
    // the copy must not tell migrated tenants to audit for silent drops.
    expect(screen.getByText(/Reserved label names are enforced/i)).toBeInTheDocument();
    expect(screen.getByText(/rejected when creating or updating checks and probes/i)).toBeInTheDocument();
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
    // Click the confirm button inside the modal (it carries the contextual confirmText)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    const confirmButton = within(screen.getByRole('dialog')).getByRole('button', { name: /^Enable dual-write$/i });
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
    const confirmButton = within(screen.getByRole('dialog')).getByRole('button', { name: /^Enable dual-write$/i });
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

  it('completes the PREFIXED → DUAL_WRITE transition end to end', async () => {
    runTestAsSMAdmin();
    const putBodies: Array<{ mode: number }> = [];
    server.use(
      apiRoute('setLabelMode', {}, async (req) => {
        putBodies.push((await req.clone().json()) as { mode: number });
      })
    );
    await renderTab();
    await userEvent.click(await screen.findByRole('button', { name: /Enable dual-write/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Enable dual-write$/i }));
    // The PUT carried the requested mode and the UI lands in the dual-write state.
    await waitFor(() => expect(screen.getByText(/Dual-write is active/i)).toBeInTheDocument());
    expect(putBodies).toEqual([{ mode: 1 }]);
    expect(screen.getByRole('button', { name: /Finalize migration/i })).toBeInTheDocument();
  });

  it('completes the DUAL_WRITE → UNPREFIXED transition end to end', async () => {
    runTestAsSMAdmin();
    server.use(
      apiRoute('getLabelMode', {
        result: () => ({ json: { mode: 1, systemLabels: TENANT_LABEL_MODE.systemLabels } }),
      })
    );
    await renderTab();
    await userEvent.click(await screen.findByRole('button', { name: /Finalize migration/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Finalize$/i }));
    await waitFor(() => expect(screen.getByText(/Migration complete/i)).toBeInTheDocument());
  });

  it('completes the UNPREFIXED → DUAL_WRITE revert end to end', async () => {
    runTestAsSMAdmin();
    server.use(
      apiRoute('getLabelMode', {
        result: () => ({ json: { mode: 2, systemLabels: TENANT_LABEL_MODE.systemLabels } }),
      })
    );
    await renderTab();
    await userEvent.click(await screen.findByRole('button', { name: /Revert to dual-write/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Revert to dual-write$/i }));
    await waitFor(() => expect(screen.getByText(/Dual-write is active/i)).toBeInTheDocument());
  });

  it('does not fire a PUT when the confirm modal is cancelled', async () => {
    runTestAsSMAdmin();
    let putCount = 0;
    server.use(
      apiRoute('setLabelMode', {}, () => {
        putCount++;
      })
    );
    await renderTab();
    await userEvent.click(await screen.findByRole('button', { name: /Enable dual-write/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Cancel/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(putCount).toBe(0);
  });

  it('keeps the collision list through reopen and cancel, clearing it on the next attempt', async () => {
    runTestAsSMAdmin();
    let calls = 0;
    server.use(
      apiRoute('setLabelMode', {
        result: () => {
          calls++;
          if (calls === 1) {
            return {
              status: 409,
              json: { msg: 'labels conflict', collidingLabels: ['probe'] },
            };
          }
          return { json: { ...TENANT_LABEL_MODE, mode: 1 } };
        },
      })
    );
    await renderTab();
    await userEvent.click(await screen.findByRole('button', { name: /Enable dual-write/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Enable dual-write$/i }));
    await waitFor(() => expect(screen.getByText(/Label name conflicts/i)).toBeInTheDocument());
    // Reopening and cancelling must not discard the rename guidance.
    await userEvent.click(screen.getByRole('button', { name: /Enable dual-write/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByText(/Label name conflicts/i)).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Cancel/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText(/Label name conflicts/i)).toBeInTheDocument();
    // A new attempt replaces the outcome: this one succeeds and the alert clears.
    await userEvent.click(screen.getByRole('button', { name: /Enable dual-write/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Enable dual-write$/i }));
    await waitFor(() => expect(screen.getByText(/Dual-write is active/i)).toBeInTheDocument());
    expect(screen.queryByText(/Label name conflicts/i)).not.toBeInTheDocument();
  });

  it('shows a contact-admin notice and no action buttons for non-admin users', async () => {
    runTestAsSMViewer();
    await renderTab();
    await waitFor(() => expect(screen.getByText(/Contact your administrator/i)).toBeInTheDocument());
    // Status remains visible, actions do not.
    expect(screen.getAllByText('Prefixed (label_foo)').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Enable dual-write/i })).not.toBeInTheDocument();
  });

  it('renders live series labels classified against the reserved set', async () => {
    runTestAsSMAdmin();
    queryInstantMetricMock.mockResolvedValueOnce([
      {
        metric: {
          __name__: 'sm_check_info',
          probe: 'live-probe',
          instance: 'live.example',
          job: 'live-job',
          env: 'user-value',
        },
        value: [1721675000, 1],
      },
    ]);
    await renderTab();
    await waitFor(() => expect(screen.getByText(/from your most recent sm_check_info series/i)).toBeInTheDocument());
    // Reserved keys from the live series render as system labels...
    expect(screen.getByText('probe="live-probe"')).toBeInTheDocument();
    // ...while non-reserved live keys (user labels) are omitted entirely.
    expect(screen.queryByText('env="user-value"')).not.toBeInTheDocument();
  });

  it('distinguishes an empty live result from a failed preview query', async () => {
    runTestAsSMAdmin();
    queryInstantMetricMock.mockResolvedValueOnce([]);
    await renderTab();
    await waitFor(() => expect(screen.getByText(/example — no live data found/i)).toBeInTheDocument());
  });

  it('reports a failed preview query instead of claiming no data', async () => {
    runTestAsSMAdmin();
    // The default instant-metrics handler rejects unknown queries with a 400.
    await renderTab();
    await waitFor(() => expect(screen.getByText(/example — the live preview query failed/i)).toBeInTheDocument());
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

  describe('transition cooldown', () => {
    const NOW = TENANT.modified * 1000 + 6 * 60 * 60 * 1000; // arbitrary fixed "now", well after the fixture's modified time

    afterEach(() => {
      jest.restoreAllMocks();
    });

    function mockTenantModifiedAgo(msAgo: number) {
      server.use(
        apiRoute('getTenant', {
          result: () => ({ json: { ...TENANT, modified: (NOW - msAgo) / 1000 } }),
        })
      );
    }

    // The button keeps a tooltip prop while cooling down, so @grafana/ui renders
    // it as aria-disabled (to stay hoverable) rather than natively disabled —
    // onClick is still nulled out either way, so clicking it is a no-op.
    async function expectCoolingDown(button: HTMLElement) {
      await waitFor(() => expect(button).toHaveAttribute('aria-disabled', 'true'));
      await userEvent.click(button);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }

    it('disables Finalize migration and shows the cooldown message when the tenant changed less than 70 minutes ago', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(NOW);
      runTestAsSMAdmin();
      mockTenantModifiedAgo(30 * 60 * 1000); // 30 minutes ago
      server.use(
        apiRoute('getLabelMode', {
          result: () => ({ json: { mode: 1, systemLabels: TENANT_LABEL_MODE.systemLabels } }),
        })
      );
      await renderTab();
      const button = await screen.findByRole('button', { name: /Finalize migration/i });
      await expectCoolingDown(button);
      // The message appears twice: once as the persistent notice, once as the button's tooltip content.
      expect(screen.getAllByText('You can change your label mode in 40 minutes').length).toBeGreaterThan(0);
    });

    it('leaves Finalize migration clickable when the tenant changed more than 70 minutes ago', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(NOW);
      runTestAsSMAdmin();
      mockTenantModifiedAgo(80 * 60 * 1000); // 80 minutes ago
      server.use(
        apiRoute('getLabelMode', {
          result: () => ({ json: { mode: 1, systemLabels: TENANT_LABEL_MODE.systemLabels } }),
        })
      );
      await renderTab();
      const button = await screen.findByRole('button', { name: /Finalize migration/i });
      await waitFor(() => expect(button).not.toBeDisabled());
      expect(screen.queryByText(/You can change your label mode/i)).not.toBeInTheDocument();
    });

    it('leaves Enable dual-write clickable during the cooldown (only finalizing is gated)', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(NOW);
      runTestAsSMAdmin();
      mockTenantModifiedAgo(30 * 60 * 1000);
      await renderTab();
      const button = await screen.findByRole('button', { name: /Enable dual-write/i });
      await waitFor(() => expect(button).not.toBeDisabled());
      expect(screen.queryByText(/You can change your label mode/i)).not.toBeInTheDocument();
    });

    it('leaves Revert to dual-write clickable during the cooldown (only finalizing is gated)', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(NOW);
      runTestAsSMAdmin();
      mockTenantModifiedAgo(30 * 60 * 1000);
      server.use(
        apiRoute('getLabelMode', {
          result: () => ({ json: { mode: 2, systemLabels: TENANT_LABEL_MODE.systemLabels } }),
        })
      );
      await renderTab();
      const button = await screen.findByRole('button', { name: /Revert to dual-write/i });
      await waitFor(() => expect(button).not.toBeDisabled());
      expect(screen.queryByText(/You can change your label mode/i)).not.toBeInTheDocument();
    });

    it('disables Finalize migration immediately after a successful transition refreshes tenant.modified', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(NOW);
      runTestAsSMAdmin();
      // Starts outside the cooldown window...
      mockTenantModifiedAgo(3 * 60 * 60 * 1000);
      let getTenantCalls = 0;
      server.use(
        apiRoute('getTenant', {
          result: () => {
            getTenantCalls++;
            // ...and the transition itself bumps modified to "now", refetched via invalidation.
            const modified = getTenantCalls === 1 ? (NOW - 3 * 60 * 60 * 1000) / 1000 : NOW / 1000;
            return { json: { ...TENANT, modified } };
          },
        })
      );
      await renderTab();
      const trigger = await screen.findByRole('button', { name: /Enable dual-write/i });
      await waitFor(() => expect(trigger).not.toBeDisabled());
      await userEvent.click(trigger);
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Enable dual-write$/i }));
      await waitFor(() => expect(screen.getByText(/Dual-write is active/i)).toBeInTheDocument());
      const finalizeButton = screen.getByRole('button', { name: /Finalize migration/i });
      // The mutation awaits the tenant invalidation, so the instant the
      // DualWrite UI appears the button must already be inert — first via the
      // still-pending mutation (busy), then via the cooldown once the refetch
      // lands. Clicking must never open the confirm dialog in between.
      await userEvent.click(finalizeButton);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await waitFor(() => expect(finalizeButton).toHaveAttribute('aria-disabled', 'true'));
      expect(screen.getAllByText('You can change your label mode in 1 hour 10 minutes').length).toBeGreaterThan(0);
    });
  });

  // triggerCollision drives the PREFIXED → DUAL_WRITE attempt into the 409
  // collision state with the given labels; setLabelMode succeeds on the retry.
  async function triggerCollision(collidingLabels: string[]) {
    let attempts = 0;
    const putBodies: Array<{ mode: number }> = [];

    server.use(
      apiRoute(
        'setLabelMode',
        {
          result: () => {
            attempts++;
            if (attempts === 1) {
              return { status: 409, json: { msg: 'labels conflict', collidingLabels } };
            }
            return { json: { ...TENANT_LABEL_MODE, mode: 1 } };
          },
        },
        async (req) => {
          putBodies.push((await req.clone().json()) as { mode: number });
        }
      )
    );

    await renderTab();
    await userEvent.click(await screen.findByRole('button', { name: /Enable dual-write/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Enable dual-write$/i }));
    await waitFor(() => expect(screen.getByText(/Label name conflicts/i)).toBeInTheDocument());

    return putBodies;
  }

  it('renames colliding labels and retries the transition end to end', async () => {
    runTestAsSMAdmin();
    const renameRequests: Array<{ url: string; body: { name: string } }> = [];
    server.use(
      apiRoute('renameCheckLabels', {}, async (req) => {
        renameRequests.push({ url: req.url, body: (await req.clone().json()) as { name: string } });
      })
    );

    const putBodies = await triggerCollision(['probe', 'instance']);

    // The retry is gated until every colliding label has been renamed.
    expect(screen.getByRole('button', { name: /Retry enabling dual-write/i })).toBeDisabled();

    await userEvent.type(screen.getByTestId('rename-input-probe'), 'probe_alias');
    await userEvent.click(screen.getAllByRole('button', { name: /^Rename$/i })[0]);
    await waitFor(() => expect(screen.getByText(/renamed on 2 checks/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Retry enabling dual-write/i })).toBeDisabled();

    await userEvent.type(screen.getByTestId('rename-input-instance'), 'instance_alias');
    await userEvent.click(screen.getAllByRole('button', { name: /^Rename$/i })[1]);
    await waitFor(() => expect(screen.getAllByText(/renamed on 2 checks/i)).toHaveLength(2));

    expect(renameRequests).toHaveLength(2);
    expect(renameRequests[0].url).toContain('/sm/check/labels/probe');
    expect(renameRequests[0].body).toEqual({ name: 'probe_alias' });
    expect(renameRequests[1].url).toContain('/sm/check/labels/instance');
    expect(renameRequests[1].body).toEqual({ name: 'instance_alias' });

    const retry = screen.getByRole('button', { name: /Retry enabling dual-write/i });
    await waitFor(() => expect(retry).toBeEnabled());
    await userEvent.click(retry);

    await waitFor(() => expect(screen.getByText(/Dual-write is active/i)).toBeInTheDocument());
    expect(putBodies).toEqual([{ mode: 1 }, { mode: 1 }]);
  });

  it('rejects reserved, duplicate, and invalid rename targets client-side', async () => {
    runTestAsSMAdmin();
    const renameRequests: string[] = [];
    server.use(
      apiRoute('renameCheckLabels', {}, async (req) => {
        renameRequests.push(req.url);
      })
    );

    await triggerCollision(['probe', 'instance']);

    // Reserved: "geohash" is in the fixture's systemLabels.
    await userEvent.type(screen.getByTestId('rename-input-probe'), 'geohash');
    await userEvent.click(screen.getAllByRole('button', { name: /^Rename$/i })[0]);
    await waitFor(() => expect(screen.getByText(/"geohash" is also a reserved system name/i)).toBeInTheDocument());

    // Invalid label syntax.
    await userEvent.clear(screen.getByTestId('rename-input-probe'));
    await userEvent.type(screen.getByTestId('rename-input-probe'), '0bad-name');
    await userEvent.click(screen.getAllByRole('button', { name: /^Rename$/i })[0]);
    await waitFor(() => expect(screen.getByText(/Invalid label name/i)).toBeInTheDocument());

    // Duplicate target across rows.
    await userEvent.clear(screen.getByTestId('rename-input-probe'));
    await userEvent.type(screen.getByTestId('rename-input-probe'), 'same_target');
    await userEvent.type(screen.getByTestId('rename-input-instance'), 'same_target');
    await userEvent.click(screen.getAllByRole('button', { name: /^Rename$/i })[1]);
    await waitFor(() =>
      expect(screen.getByText(/"same_target" is already the target of another rename/i)).toBeInTheDocument()
    );

    // None of the rejected attempts reached the API.
    expect(renameRequests).toHaveLength(0);
  });

  it('surfaces the API conflict when a check already carries both label keys', async () => {
    runTestAsSMAdmin();
    server.use(
      apiRoute('renameCheckLabels', {
        result: () => ({
          status: 409,
          json: { msg: 'cannot rename "probe" to "probe_alias": one or more checks already carry both label keys' },
        }),
      })
    );

    await triggerCollision(['probe']);

    await userEvent.type(screen.getByTestId('rename-input-probe'), 'probe_alias');
    await userEvent.click(screen.getByRole('button', { name: /^Rename$/i }));
    await waitFor(() => expect(screen.getByText(/already carry both label keys/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Retry enabling dual-write/i })).toBeDisabled();
  });

  it('hints at probe labels when a rename matches no checks', async () => {
    runTestAsSMAdmin();
    server.use(
      apiRoute('renameCheckLabels', {
        result: () => ({ json: { updated_ids: [] } }),
      })
    );

    await triggerCollision(['probe']);

    await userEvent.type(screen.getByTestId('rename-input-probe'), 'probe_alias');
    await userEvent.click(screen.getByRole('button', { name: /^Rename$/i }));
    await waitFor(() => expect(screen.getByText(/it may be set on a probe/i)).toBeInTheDocument());
    // The gate opens even though nothing was fixed: the retry will 409 again
    // and remount the flow — deliberate, since only the API knows the truth.
    expect(screen.getByRole('button', { name: /Retry enabling dual-write/i })).toBeEnabled();
  });

  it('locks a row after a successful rename', async () => {
    runTestAsSMAdmin();
    await triggerCollision(['probe']);

    await userEvent.type(screen.getByTestId('rename-input-probe'), 'probe_alias');
    await userEvent.click(screen.getByRole('button', { name: /^Rename$/i }));
    await waitFor(() => expect(screen.getByText(/renamed on 2 checks/i)).toBeInTheDocument());

    expect(screen.getByTestId('rename-input-probe')).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Rename$/i })).toBeDisabled();
  });

  it('falls back to a generic error when a rename failure carries no message', async () => {
    runTestAsSMAdmin();
    server.use(
      apiRoute('renameCheckLabels', {
        result: () => ({ status: 500, json: {} }),
      })
    );

    await triggerCollision(['probe']);

    await userEvent.type(screen.getByTestId('rename-input-probe'), 'probe_alias');
    await userEvent.click(screen.getByRole('button', { name: /^Rename$/i }));
    await waitFor(() => expect(screen.getByText(/Failed to rename label/i)).toBeInTheDocument());
  });

  it('mounts a fresh rename flow when the retry collides again', async () => {
    runTestAsSMAdmin();

    // First attempt collides on "probe"; the retry collides on "instance"
    // (e.g. a probe-borne label surfaced after the check rename).
    let attempts = 0;
    server.use(
      apiRoute('setLabelMode', {
        result: () => {
          attempts++;
          if (attempts === 1) {
            return { status: 409, json: { msg: 'labels conflict', collidingLabels: ['probe'] } };
          }
          return { status: 409, json: { msg: 'labels conflict', collidingLabels: ['instance'] } };
        },
      })
    );

    await renderTab();
    await userEvent.click(await screen.findByRole('button', { name: /Enable dual-write/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Enable dual-write$/i }));
    await waitFor(() => expect(screen.getByTestId('rename-input-probe')).toBeInTheDocument());

    await userEvent.type(screen.getByTestId('rename-input-probe'), 'probe_alias');
    await userEvent.click(screen.getByRole('button', { name: /^Rename$/i }));
    await waitFor(() => expect(screen.getByText(/renamed on 2 checks/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Retry enabling dual-write/i }));

    // The second 409 remounts the flow against the new label list: no stale
    // renamed markers, empty input, gate closed again.
    await waitFor(() => expect(screen.getByTestId('rename-input-instance')).toBeInTheDocument());
    expect(screen.queryByTestId('rename-input-probe')).not.toBeInTheDocument();
    expect(screen.queryByText(/renamed on 2 checks/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('rename-input-instance')).toHaveValue('');
    expect(screen.getByRole('button', { name: /Retry enabling dual-write/i })).toBeDisabled();
  });
});
