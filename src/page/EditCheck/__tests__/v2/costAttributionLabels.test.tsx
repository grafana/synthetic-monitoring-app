import { screen, waitFor } from '@testing-library/react';
import { ROUTER_TEST_ID } from 'test/dataTestIds';
import { BASIC_SCRIPTED_CHECK } from 'test/fixtures/checks';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';
import { mockCmabCostAttributionWrite, mockFeatureToggles } from 'test/utils';

import { FormSectionName } from '../../../../components/Checkster/types';
import { Check, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { gotoSection, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderEditForm } from 'page/__testHelpers__/checkForm';

// The tenant has two cost attribution labels (Team, Service). The check fixture stores a value for
// Team plus one ordinary label, and has nothing for Service — so editing it exercises the whole
// split of a stored `labels` array into the form's `calLabels` and `labels` fields.
const SET_CAL = 'Team';
const SET_CAL_VALUE = 'frontend';
const UNSET_CAL = 'Service';
const CUSTOM_LABEL_NAME = 'scriptedLabelName';
const CUSTOM_LABEL_VALUE = 'scriptedLabelValue';

function mockCalNames(names: string[]) {
  server.use(apiRoute(`getTenantCostAttributionLabels`, { result: () => ({ json: { names } }) }));
}

function failCalsRequest() {
  server.use(apiRoute(`getTenantCostAttributionLabels`, { result: () => ({ status: 500 }) }));
}

async function goToLabels() {
  const res = await renderEditForm(BASIC_SCRIPTED_CHECK.id);
  await gotoSection(res.user, FormSectionName.Labels);

  return res;
}

async function readSavedCheck(read: () => Promise<{ body?: Check }>) {
  await waitFor(() => {
    const pathInfo = screen.getByTestId(ROUTER_TEST_ID.pathname);
    expect(pathInfo.textContent).toBe(generateRoutePath(AppRoutes.CheckDashboard, { id: BASIC_SCRIPTED_CHECK.id! }));
  });

  const { body } = await read();

  return body;
}

describe('cost attribution labels on the check form', () => {
  describe('when the CALs feature is enabled', () => {
    beforeEach(() => {
      mockFeatureToggles({ [FeatureName.CALs]: true });
    });

    it('shows a row per configured CAL, filled from the check and blank where it has no value', async () => {
      await goToLabels();

      expect(await screen.findByRole('textbox', { name: 'Cost attribution label 1 name' })).toHaveValue(SET_CAL);
      expect(screen.getByRole('textbox', { name: 'Cost attribution label 1 value' })).toHaveValue(SET_CAL_VALUE);
      expect(screen.getByRole('textbox', { name: 'Cost attribution label 2 name' })).toHaveValue(UNSET_CAL);
      expect(screen.getByRole('textbox', { name: 'Cost attribution label 2 value' })).toHaveValue('');
    });

    it('leaves only the non-CAL labels in the custom labels section', async () => {
      await goToLabels();

      expect(await screen.findByRole('textbox', { name: 'Custom labels 1 name' })).toHaveValue(CUSTOM_LABEL_NAME);
      expect(screen.getByRole('textbox', { name: 'Custom labels 1 value' })).toHaveValue(CUSTOM_LABEL_VALUE);
      expect(screen.queryByRole('textbox', { name: 'Custom labels 2 name' })).not.toBeInTheDocument();
    });

    it('does not let a CAL name be edited or removed', async () => {
      await goToLabels();

      expect(await screen.findByRole('textbox', { name: 'Cost attribution label 1 name' })).toHaveAttribute('readonly');
      // One remove button, for the single custom label — the CAL rows have none.
      expect(screen.getAllByRole('button', { name: /^remove$/i })).toHaveLength(1);
    });

    it('merges a newly filled CAL back into the check labels on save', async () => {
      const { user, read } = await goToLabels();

      const serviceValue = await screen.findByRole('textbox', { name: 'Cost attribution label 2 value' });
      await user.type(serviceValue, 'checkout');

      await submitForm(user);

      expect((await readSavedCheck(read))?.labels).toEqual([
        { name: SET_CAL, value: SET_CAL_VALUE },
        { name: UNSET_CAL, value: 'checkout' },
        { name: CUSTOM_LABEL_NAME, value: CUSTOM_LABEL_VALUE },
      ]);
    });

    it('omits a cleared CAL from the saved labels', async () => {
      const { user, read } = await goToLabels();

      const teamValue = await screen.findByRole('textbox', { name: 'Cost attribution label 1 value' });
      await user.clear(teamValue);

      await submitForm(user);

      expect((await readSavedCheck(read))?.labels).toEqual([{ name: CUSTOM_LABEL_NAME, value: CUSTOM_LABEL_VALUE }]);
    });

    it('preserves in-progress edits when CAL names arrive after the form has rendered', async () => {
      let resolveCals!: (value: { names: string[] }) => void;
      const calsDeferred = new Promise<{ names: string[] }>((resolve) => {
        resolveCals = resolve;
      });

      server.use(
        apiRoute(`getTenantCostAttributionLabels`, {
          result: async () => ({
            json: await calsDeferred,
          }),
        })
      );

      const { user } = await renderEditForm(BASIC_SCRIPTED_CHECK.id);

      const jobField = await screen.findByLabelText(/Job name/i);
      await user.clear(jobField);
      await user.type(jobField, 'edited-job-before-cals');

      resolveCals({ names: ['Team', 'Service'] });

      await gotoSection(user, FormSectionName.Labels);

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: 'Cost attribution label 1 name' })).toHaveValue(SET_CAL);
      });

      expect(jobField).toHaveValue('edited-job-before-cals');
      expect(screen.getByRole('textbox', { name: 'Cost attribution label 1 value' })).toHaveValue(SET_CAL_VALUE);
    });

    it('nudges the tenant to set up cost attribution when they have no CALs', async () => {
      mockCalNames([]);
      await goToLabels();

      expect(await screen.findByTestId('cost-attribution-setup-hint')).toBeInTheDocument();
      expect(screen.queryByText('Cost attribution labels')).not.toBeInTheDocument();
    });

    it('does not nudge a user without cost attribution write permission', async () => {
      mockCmabCostAttributionWrite(false);
      mockCalNames([]);
      await goToLabels();

      expect(await screen.findByRole('textbox', { name: 'Custom labels 1 name' })).toBeInTheDocument();
      expect(screen.queryByTestId('cost-attribution-setup-hint')).not.toBeInTheDocument();
    });

    it('does not nudge when the CALs request fails, since the tenant may already have CALs', async () => {
      failCalsRequest();
      await goToLabels();

      expect(await screen.findByRole('textbox', { name: 'Custom labels 1 name' })).toBeInTheDocument();
      expect(screen.queryByTestId('cost-attribution-setup-hint')).not.toBeInTheDocument();
    });

    it('keeps a CAL-named label as a custom label when the CALs request fails', async () => {
      failCalsRequest();
      await goToLabels();

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: 'Custom labels 1 name' })).toHaveValue(SET_CAL);
      });
      expect(screen.queryByText('Cost attribution labels')).not.toBeInTheDocument();
    });
  });

  describe('when the CALs feature is disabled', () => {
    beforeEach(() => {
      mockFeatureToggles({ [FeatureName.CALs]: false });
    });

    it('shows every label as a custom label and no CAL section', async () => {
      await goToLabels();

      expect(await screen.findByRole('textbox', { name: 'Custom labels 1 name' })).toHaveValue(SET_CAL);
      expect(screen.getByRole('textbox', { name: 'Custom labels 2 name' })).toHaveValue(CUSTOM_LABEL_NAME);
      expect(screen.queryByText('Cost attribution labels')).not.toBeInTheDocument();
    });

    it('does not show the setup hint', async () => {
      mockCalNames([]);
      await goToLabels();

      expect(await screen.findByRole('textbox', { name: 'Custom labels 1 name' })).toBeInTheDocument();
      expect(screen.queryByTestId('cost-attribution-setup-hint')).not.toBeInTheDocument();
    });
  });
});
