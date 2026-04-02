import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { screen } from '@testing-library/react';
import { render } from 'test/render';
import { mockFeatureToggles } from 'test/utils';

import { FeatureName } from 'types';

import { FormFolderField } from './FormFolderField';

function Wrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm({ defaultValues: { folderUid: undefined } });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('FormFolderField', () => {
  it('renders the folder field when feature flag is enabled', async () => {
    mockFeatureToggles({ [FeatureName.Folders]: true });

    render(
      <Wrapper>
        <FormFolderField />
      </Wrapper>
    );

    expect(await screen.findByText('Folder')).toBeInTheDocument();
    expect(screen.getByText(/Choose a folder/)).toBeInTheDocument();
  });

  it('renders nothing when feature flag is disabled', () => {
    render(
      <Wrapper>
        <FormFolderField />
      </Wrapper>
    );

    expect(screen.queryByText('Folder')).not.toBeInTheDocument();
  });
});
