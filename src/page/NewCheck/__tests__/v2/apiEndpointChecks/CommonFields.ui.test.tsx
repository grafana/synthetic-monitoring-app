import { screen } from '@testing-library/react';
import { mockFeatureToggles } from 'test/utils';

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
  });
});
