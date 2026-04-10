import React from 'react';
import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { CheckPermissions } from 'data/folderPermissions';

import { CheckItemActionButtons } from './CheckItemActionButtons';

const FULL_ACCESS: CheckPermissions = { canRead: true, canWrite: true, canDelete: true };
const READ_ONLY: CheckPermissions = { canRead: true, canWrite: false, canDelete: false };

describe('CheckItemActionButtons', () => {
  describe(`View dashboard`, () => {
    it(`should render the view dashboard button`, async () => {
      render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} effectivePermissions={FULL_ACCESS} />);
      expect(await screen.findByText('View dashboard')).toBeInTheDocument();
    });

    it(`should render both a text link and icon link when responsiveDashboardLink is true`, async () => {
      render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} effectivePermissions={FULL_ACCESS} responsiveDashboardLink />);
      expect(await screen.findByText('View dashboard')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to dashboard')).toBeInTheDocument();
    });

    it(`should render only an icon link when viewDashboardAsIcon is true`, async () => {
      render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} effectivePermissions={FULL_ACCESS} viewDashboardAsIcon />);
      expect(await screen.findByLabelText('Go to dashboard')).toBeInTheDocument();
      expect(screen.queryByText('View dashboard')).not.toBeInTheDocument();
    });
  });

  describe(`Enable/Disable check`, () => {
    it(`the enable/disable check button should be disabled when the user has read-only access`, async () => {
      render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} effectivePermissions={READ_ONLY} />);
      expect(await screen.findByLabelText('Disable check')).toBeDisabled();
    });

    it(`the enable check button should be disabled when the user has read-only access`, async () => {
      render(<CheckItemActionButtons check={{ ...BASIC_HTTP_CHECK, enabled: false }} effectivePermissions={READ_ONLY} />);
      expect(await screen.findByLabelText('Enable check')).toBeDisabled();
    });

    it(`should render the disable check button when the check is enabled`, async () => {
      render(<CheckItemActionButtons check={{ ...BASIC_HTTP_CHECK, enabled: true }} effectivePermissions={FULL_ACCESS} />);
      expect(await screen.findByLabelText('Disable check')).toBeInTheDocument();
    });

    it(`should render the enable check button when the check is disabled`, async () => {
      render(<CheckItemActionButtons check={{ ...BASIC_HTTP_CHECK, enabled: false }} effectivePermissions={FULL_ACCESS} />);
      expect(await screen.findByLabelText('Enable check')).toBeInTheDocument();
    });

    it(`should send a request to disable the check when the disable button is clicked`, async () => {
      const { user } = render(<CheckItemActionButtons check={{ ...BASIC_HTTP_CHECK, enabled: true }} effectivePermissions={FULL_ACCESS} />);
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
      const { user } = render(<CheckItemActionButtons check={{ ...BASIC_HTTP_CHECK, enabled: false }} effectivePermissions={FULL_ACCESS} />);
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
    it(`the edit check button should be disabled when the user has read-only access`, async () => {
      render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} effectivePermissions={READ_ONLY} />);
      expect(await screen.findByLabelText('Edit check')).toHaveAttribute('aria-disabled', 'true');
    });

    it(`should render the edit check button`, async () => {
      render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} effectivePermissions={FULL_ACCESS} />);
      expect(await screen.findByLabelText('Edit check')).toBeInTheDocument();
    });
  });

  describe(`Delete check`, () => {
    it(`should disable the delete check button when the user has read-only access`, async () => {
      render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} effectivePermissions={READ_ONLY} />);
      expect(await screen.findByLabelText('Delete check')).toBeDisabled();
    });

    it(`should render the delete check button`, async () => {
      render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} effectivePermissions={FULL_ACCESS} />);
      expect(await screen.findByLabelText('Delete check')).toBeInTheDocument();
    });

    it(`should render the delete check modal when the delete button is clicked`, async () => {
      const { user } = render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} effectivePermissions={FULL_ACCESS} />);
      const deleteButton = await screen.findByLabelText('Delete check');
      await user.click(deleteButton);
      expect(await screen.findByText('Are you sure you want to delete this check?')).toBeInTheDocument();
    });
  });
});
