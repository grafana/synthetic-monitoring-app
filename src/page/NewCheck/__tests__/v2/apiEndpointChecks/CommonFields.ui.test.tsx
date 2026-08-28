import { screen } from '@testing-library/react';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';
import { DEFAULT_FOLDER } from 'test/fixtures/folders';
import { mockFeatureToggles, runTestWithReadOnlyDefaultFolder, runTestWithSlowFolderLookups } from 'test/utils';

import { CheckType, FeatureName } from 'types';

import { renderNewForm } from '../../../../__testHelpers__/checkForm';

describe('Api endpoint checks - common fields UI', () => {
  describe('Folder field', () => {
    it('displays the folder selector when feature flag is enabled', async () => {
      mockFeatureToggles({ [FeatureName.Folders]: true });
      await renderNewForm(CheckType.Http);

      expect(await screen.findByText('Folder')).toBeInTheDocument();
      expect(screen.getByText('Choose a folder where you want to store the check.')).toBeInTheDocument();
    });

    it('does not display the folder selector when feature flag is disabled', async () => {
      await renderNewForm(CheckType.Http);

      expect(screen.queryByText('Folder')).not.toBeInTheDocument();
    });

    it('preselects the default folder when the user can edit it, without dirtying the form', async () => {
      mockFeatureToggles({ [FeatureName.Folders]: true });
      await renderNewForm(CheckType.Http);

      const picker = await screen.findByLabelText('Folder picker');
      expect(picker).toHaveDisplayValue(DEFAULT_FOLDER.title);
      // Preselection goes through the form defaults: an untouched form must not
      // enable Save or warn about unsaved changes.
      expect(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton)).toBeDisabled();
    });

    it('seeds the folder before the form mounts even when folder lookups are slow', async () => {
      mockFeatureToggles({ [FeatureName.Folders]: true });
      runTestWithSlowFolderLookups({ delayMs: 100 });
      await renderNewForm(CheckType.Http);

      // The form only mounts once the pre-fill decision is final, so the
      // moment the picker exists the seeded folder must already be in it.
      const picker = await screen.findByLabelText('Folder picker');
      expect(picker).toHaveValue(DEFAULT_FOLDER.uid);
    });

    it('does not preselect a default folder the user cannot edit', async () => {
      mockFeatureToggles({ [FeatureName.Folders]: true });
      runTestWithReadOnlyDefaultFolder();
      await renderNewForm(CheckType.Http);

      const picker = await screen.findByLabelText('Folder picker');
      expect(picker).toHaveDisplayValue('Select folder');
    });
  });
});
