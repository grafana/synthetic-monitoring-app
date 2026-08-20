import { screen } from '@testing-library/react';
import { DEFAULT_FOLDER } from 'test/fixtures/folders';
import { mockFeatureToggles, runTestWithReadOnlyDefaultFolder } from 'test/utils';

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

    it('preselects the default folder when the user can edit it', async () => {
      mockFeatureToggles({ [FeatureName.Folders]: true });
      await renderNewForm(CheckType.Http);

      expect(await screen.findByDisplayValue(`${DEFAULT_FOLDER.title} (Default)`)).toBeInTheDocument();
    });

    it('does not preselect a default folder the user cannot edit', async () => {
      mockFeatureToggles({ [FeatureName.Folders]: true });
      runTestWithReadOnlyDefaultFolder();
      await renderNewForm(CheckType.Http);

      const folderInput = await screen.findByPlaceholderText(/Select a folder/);
      expect(folderInput).toHaveValue('');
    });
  });
});
