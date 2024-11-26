import React, { PropsWithChildren } from 'react';
import { Router } from 'react-router-dom';
import { CompatRouter, Route, Routes } from 'react-router-dom-v5-compat';
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

function Wrapper({ children }: PropsWithChildren<{}>) {
  const history = locationService.getHistory();
  // History will not automatically be reset between tests
  history.replace('/');

  return (
    <Router history={history}>
      <CompatRouter>
        <Routes>
          <Route path="/" element={<div data-testid={TEST_IDS.INITIAL_PAGE}>{children}</div>} />
          <Route path="*" element={<div data-testid={TEST_IDS.OTHER_PAGE} />} />
        </Routes>
      </CompatRouter>
    </Router>
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
    it.each([
      ['Stay on page', TEST_IDS.INITIAL_PAGE],
      ['Leave page', TEST_IDS.OTHER_PAGE],
    ])('should render a modal when navigating away (%s)', async (buttonText, expectedTestId) => {
      render(
        <>
          <TextLink href="some-other-route" data-testid={TEST_IDS.LEAVE_PAGE_LINK}>
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
      expect(await screen.findByTestId(DataTestIds.CONFIRM_UNSAVED_MODAL_HEADING)).toBeInTheDocument();
      await user.click(screen.getByText(buttonText, { selector: 'button > span' }));
      expect(await screen.findByTestId(expectedTestId)).toBeInTheDocument();
    });
  });

  describe('onbeforeunload', () => {
    it('should trigger confirm on beforeunload', async () => {
      render(
        <>
          <TextLink href="some-other-route" data-testid={TEST_IDS.LEAVE_PAGE_LINK}>
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
