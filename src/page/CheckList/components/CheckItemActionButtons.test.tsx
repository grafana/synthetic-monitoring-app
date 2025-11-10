import React from 'react';
import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { runTestAsViewer } from 'test/utils';

import { CheckItemActionButtons } from './CheckItemActionButtons';

describe('CheckItemActionButtons', () => {
  describe(`View dashboard`, () => {
    it(`should render the view dashboard button`, async () => {
      render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} />);
      expect(await screen.findByText('View dashboard')).toBeInTheDocument();
    });
  });

  describe(`Enable/Disable check`, () => {
    it(`the enable/disable check button should be disabled when the user is not a writer`, async () => {
      runTestAsViewer();
      render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} />);
      expect(await screen.findByLabelText('Disable check')).toBeDisabled();
    });

    it(`the enable/disable check button should be disabled when the user is not a writer`, async () => {
      runTestAsViewer();
      render(<CheckItemActionButtons check={{ ...BASIC_HTTP_CHECK, enabled: false }} />);
      expect(await screen.findByLabelText('Enable check')).toBeDisabled();
    });

    it(`should render the disable check button when the check is enabled`, async () => {
      render(<CheckItemActionButtons check={{ ...BASIC_HTTP_CHECK, enabled: true }} />);
      expect(await screen.findByLabelText('Disable check')).toBeInTheDocument();
    });

    it(`should render the enable check button when the check is disabled`, async () => {
      render(<CheckItemActionButtons check={{ ...BASIC_HTTP_CHECK, enabled: false }} />);
      expect(await screen.findByLabelText('Enable check')).toBeInTheDocument();
    });

    it(`should send a request to disable the check when the disable button is clicked`, async () => {
      const { user } = render(<CheckItemActionButtons check={{ ...BASIC_HTTP_CHECK, enabled: true }} />);
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
      const { user } = render(<CheckItemActionButtons check={{ ...BASIC_HTTP_CHECK, enabled: false }} />);
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
    it(`the edit check button should be disabled when the user is not a writer`, async () => {
      runTestAsViewer();
      render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} />);
      expect(await screen.findByLabelText('Edit check')).toHaveAttribute('aria-disabled', 'true');
    });

    it(`should render the edit check button`, async () => {
      render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} />);
      expect(await screen.findByLabelText('Edit check')).toBeInTheDocument();
    });
  });

  describe(`Delete check`, () => {
    it(`should not render the delete check button when the user is not a writer`, async () => {
      runTestAsViewer();
      render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} />);
      expect(await screen.findByLabelText('Delete check')).toBeDisabled();
    });

    it(`should render the delete check button`, async () => {
      render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} />);
      expect(await screen.findByLabelText('Delete check')).toBeInTheDocument();
    });

    it(`should render the delete check modal when the delete button is clicked`, async () => {
      const { user } = render(<CheckItemActionButtons check={BASIC_HTTP_CHECK} />);
      const deleteButton = await screen.findByLabelText('Delete check');
      await user.click(deleteButton);
      expect(await screen.findByText('Are you sure you want to delete this check?')).toBeInTheDocument();
    });
  });
});
