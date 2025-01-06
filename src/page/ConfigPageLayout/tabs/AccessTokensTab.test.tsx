import React from 'react';
import { runTestAsRBACAdmin, runTestAsRBACReader, runTestAsSMEditor, runTestAsSMViewer } from 'test/utils';

import { DataTestIds } from '../../../test/dataTestIds';
import { render } from '../../../test/render';
import { AccessTokensTab } from './AccessTokensTab';

async function renderAccessTokensTab() {
  const result = render(<AccessTokensTab />);
  await result.findByTestId(DataTestIds.CONFIG_CONTENT);

  return result;
}

describe('AccessTokensTab', () => {
  it('should render', async () => {
    const { container } = await renderAccessTokensTab();
    expect(container).toBeInTheDocument();
  });

  it('should render with title', async () => {
    const { getByText } = await renderAccessTokensTab();
    expect(getByText('Access tokens')).toBeInTheDocument();
  });

  it('should have a section on access tokens', async () => {
    const { getByText } = await renderAccessTokensTab();
    expect(getByText('Access tokens', { selector: 'h2' })).toBeInTheDocument();
  });

  it('should have a section on synthetic monitoring', async () => {});

  it('should have a section on private probes', async () => {
    const { getByText } = await renderAccessTokensTab();
    expect(getByText('Private probes', { selector: 'h3' })).toBeInTheDocument();
  });

  describe('Permissions', () => {
    const contactAdminMessage = `Contact your administrator to generate Access Tokens`;

    describe('When RBAC is enabled', () => {
      it(`Displays a contact admin message when permissions are not met`, async () => {
        runTestAsRBACReader();
        const { queryByText } = await renderAccessTokensTab();
        expect(queryByText(contactAdminMessage)).toBeInTheDocument();
      });

      it(`Does not display a contact admin message when permissions are met`, async () => {
        runTestAsRBACAdmin();
        const { queryByText } = await renderAccessTokensTab();
        expect(queryByText(contactAdminMessage)).not.toBeInTheDocument();
      });
    });

    describe('When RBAC is disabled', () => {
      it(`Displays a contact admin message when permissions are not met`, async () => {
        runTestAsSMViewer();
        const { queryByText } = await renderAccessTokensTab();
        expect(queryByText(contactAdminMessage)).toBeInTheDocument();
      });

      it(`Does not display a contact admin message when permissions are met`, async () => {
        runTestAsSMEditor();
        const { queryByText } = await renderAccessTokensTab();
        expect(queryByText(contactAdminMessage)).not.toBeInTheDocument();
      });
    });
  });
});
