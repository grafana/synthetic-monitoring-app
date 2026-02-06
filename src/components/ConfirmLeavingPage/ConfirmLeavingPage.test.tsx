import React, { PropsWithChildren } from 'react';
import { Route, Routes, unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import { locationService } from '@grafana/runtime';
import { TextLink } from '@grafana/ui';
import { fireEvent, render, screen } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';

import { DataTestIds } from '../../test/dataTestIds';
import { ConfirmLeavingPage } from './ConfirmLeavingPage';

const TEST_IDS = {
  INITIAL_PAGE: 'ConfirmLeavingPage.initial-page',
  LEAVE_PAGE_LINK: 'ConfirmLeavingPage.leave-page-link',
  OTHER_PAGE: 'ConfirmLeavingPage.other-route',
} as const;

beforeAll(() => {
  // History needs to be reset manually between tests as it uses Grafana's global locationService
  locationService.replace('/');
});

afterEach(() => {
  // History needs to be reset manually between tests as it uses Grafana's global locationService
  locationService.replace('/');
});

function Wrapper({ children }: PropsWithChildren<{}>) {
  // The component uses locationService.getHistory() internally for blocking navigation.
  // We use HistoryRouter with Grafana's history so both React Router and the component
  // share the same history instance for blocking to work.
  const history = locationService.getHistory() as unknown as Parameters<typeof HistoryRouter>[0]['history'];

  return (
    <HistoryRouter history={history}>
      <Routes>
        <Route path="/" element={<div data-testid={TEST_IDS.INITIAL_PAGE}>{children}</div>} />
        <Route path="*" element={<div data-testid={TEST_IDS.OTHER_PAGE} />} />
      </Routes>
    </HistoryRouter>
  );
}

describe('ConfirmLeavingPage', () => {
  it.each([false, true, undefined])('should not render anything on mount (enabled: %s)', async (enabled) => {
    // @ts-expect-error Intentionally testing with `undefined`
    render(<ConfirmLeavingPage enabled={enabled} />, { wrapper: Wrapper });
    const container = screen.queryByTestId(TEST_IDS.INITIAL_PAGE);
    expect(container).toBeEmptyDOMElement();
  });

  describe('router navigation', () => {
    it('should render a modal when navigating away and stay on page when clicking "Stay on page"', async () => {
      render(
        <>
          <TextLink href="/some-other-route" data-testid={TEST_IDS.LEAVE_PAGE_LINK}>
            Leave page
          </TextLink>
          <ConfirmLeavingPage enabled />
        </>,
        { wrapper: Wrapper }
      );

      expect(await screen.findByTestId(TEST_IDS.INITIAL_PAGE)).toBeInTheDocument();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const user = userEventLib.setup();
      const link = screen.getByTestId(TEST_IDS.LEAVE_PAGE_LINK);
      await user.click(link);
      expect(await screen.findByTestId(DataTestIds.ConfirmUnsavedModalHeading)).toBeInTheDocument();
      await user.click(screen.getByText('Stay on page', { selector: 'button > span' }));
      expect(await screen.findByTestId(TEST_IDS.INITIAL_PAGE)).toBeInTheDocument();
    });

    it('should close modal and allow navigation when clicking "Leave page"', async () => {
      render(
        <>
          <TextLink href="/some-other-route" data-testid={TEST_IDS.LEAVE_PAGE_LINK}>
            Leave page
          </TextLink>
          <ConfirmLeavingPage enabled />
        </>,
        { wrapper: Wrapper }
      );

      expect(await screen.findByTestId(TEST_IDS.INITIAL_PAGE)).toBeInTheDocument();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const user = userEventLib.setup();
      const link = screen.getByTestId(TEST_IDS.LEAVE_PAGE_LINK);
      await user.click(link);
      expect(await screen.findByTestId(DataTestIds.ConfirmUnsavedModalHeading)).toBeInTheDocument();
      await user.click(screen.getByText('Leave page', { selector: 'button > span' }));
      expect(screen.queryByTestId(DataTestIds.ConfirmUnsavedModalHeading)).not.toBeInTheDocument();
    });
  });

  describe('onbeforeunload', () => {
    it('should trigger confirm on beforeunload', async () => {
      render(
        <>
          <TextLink href="/some-other-route" data-testid={TEST_IDS.LEAVE_PAGE_LINK}>
            Leave page
          </TextLink>
          <ConfirmLeavingPage enabled />
        </>,
        { wrapper: Wrapper }
      );

      expect(await screen.findByTestId(TEST_IDS.INITIAL_PAGE)).toBeInTheDocument();
      const event = new Event('beforeunload', { cancelable: true });
      fireEvent(window, event);
      expect(event.defaultPrevented).toBe(true);
    });
  });
});
