import React from 'react';
import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { CheckFolderAccessProvider } from 'contexts/CheckFolderAccessContext';

import { CheckItemActionButtons } from './CheckItemActionButtons';

const renderWithProvider = (check = BASIC_HTTP_CHECK) => {
  return render(
    <CheckFolderAccessProvider checks={[check]}>
      <CheckItemActionButtons check={check} />
    </CheckFolderAccessProvider>
  );
};

describe('CheckItemActionButtons', () => {
  describe(`View dashboard`, () => {
    it(`should render the view dashboard button`, async () => {
      renderWithProvider();
      expect(await screen.findByText('View dashboard')).toBeInTheDocument();
    });

    it(`should render both a text link and icon link when responsiveDashboardLink is true`, async () => {
      render(
        <CheckFolderAccessProvider checks={[BASIC_HTTP_CHECK]}>
          <CheckItemActionButtons check={BASIC_HTTP_CHECK} responsiveDashboardLink />
        </CheckFolderAccessProvider>
      );
      expect(await screen.findByText('View dashboard')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to dashboard')).toBeInTheDocument();
    });

    it(`should render only an icon link when viewDashboardAsIcon is true`, async () => {
      render(
        <CheckFolderAccessProvider checks={[BASIC_HTTP_CHECK]}>
          <CheckItemActionButtons check={BASIC_HTTP_CHECK} viewDashboardAsIcon />
        </CheckFolderAccessProvider>
      );
      expect(await screen.findByLabelText('Go to dashboard')).toBeInTheDocument();
      expect(screen.queryByText('View dashboard')).not.toBeInTheDocument();
    });
  });

  describe(`Enable/Disable check`, () => {
    it(`should render the disable check button when the check is enabled`, async () => {
      renderWithProvider({ ...BASIC_HTTP_CHECK, enabled: true });
      expect(await screen.findByLabelText('Disable check')).toBeInTheDocument();
    });

    it(`should render the enable check button when the check is disabled`, async () => {
      renderWithProvider({ ...BASIC_HTTP_CHECK, enabled: false });
      expect(await screen.findByLabelText('Enable check')).toBeInTheDocument();
    });

    it(`should send a request to disable the check when the disable button is clicked`, async () => {
      const { user } = renderWithProvider({ ...BASIC_HTTP_CHECK, enabled: true });
      const { read, record } = getServerRequests();
      server.use(apiRoute(`updateCheck`, {}, record));

      const disableButton = await screen.findByLabelText('Disable check');
      await user.click(disableButton);

      const { body } = await read();

      expect(body).toEqual({
        ...BASIC_HTTP_CHECK,
        enabled: false,
      });
    });

    it(`should send a request to enable the check when the enable button is clicked`, async () => {
      const { user } = renderWithProvider({ ...BASIC_HTTP_CHECK, enabled: false });
      const { read, record } = getServerRequests();
      server.use(apiRoute(`updateCheck`, {}, record));

      const enableButton = await screen.findByLabelText('Enable check');
      await user.click(enableButton);

      const { body } = await read();
      expect(body).toEqual({
        ...BASIC_HTTP_CHECK,
        enabled: true,
      });
    });
  });

  describe(`Edit check`, () => {
    it(`should render the edit check button`, async () => {
      renderWithProvider();
      expect(await screen.findByLabelText('Edit check')).toBeInTheDocument();
    });
  });

  describe(`Delete check`, () => {
    it(`should render the delete check button`, async () => {
      renderWithProvider();
      expect(await screen.findByLabelText('Delete check')).toBeInTheDocument();
    });

    it(`should render the delete check modal when the delete button is clicked`, async () => {
      const { user } = renderWithProvider();
      const deleteButton = await screen.findByLabelText('Delete check');
      await user.click(deleteButton);
      expect(await screen.findByText('Are you sure you want to delete this check?')).toBeInTheDocument();
    });
  });
});
