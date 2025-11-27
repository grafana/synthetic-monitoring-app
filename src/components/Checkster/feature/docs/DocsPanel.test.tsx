import { screen } from '@testing-library/dom';

import { CheckType } from 'types';
import { SM_CHECKS_DOCS_TEXT } from 'components/Checkster/feature/docs/AboutApiEndpointChecks';
import { K6_STUDIO_DOCS_TEXT } from 'components/Checkster/feature/docs/Aboutk6Studio';
import { SCRIPTED_CHECKS_DOCS_TEXT } from 'components/Checkster/feature/docs/AboutScriptedChecks';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';

const EXPECTED_BROWSER_DOCS_TEXT = `k6 browser checks run a k6 script using the browser module to control a headless browser. Write native JavaScript to control the browser and perform actions like clicking buttons, filling out forms, and more.`;

describe('DocsPanel', () => {
  describe('API Endpoint checks', () => {
    it.each([CheckType.DNS, CheckType.GRPC, CheckType.HTTP, CheckType.PING, CheckType.TCP, CheckType.Traceroute])(
      'should render a docs tab for %s checks',
      async (checkType) => {
        const { user } = await renderNewFormV2(checkType);

        const tab = await screen.findByText('Docs');
        await user.click(tab);
        expect(screen.getByText(SM_CHECKS_DOCS_TEXT)).toBeInTheDocument();
      }
    );
  });

  describe('Multi Step checks', () => {
    it.each([CheckType.MULTI_HTTP])('should render a docs tab for %s checks', async (checkType) => {
      const { user } = await renderNewFormV2(checkType);

      const tab = await screen.findByText('Docs');
      await user.click(tab);
      expect(screen.getByText(SM_CHECKS_DOCS_TEXT)).toBeInTheDocument();
    });
  });

  describe('Scripted checks', () => {
    it('should render a docs tab for scripted checks', async () => {
      const { user } = await renderNewFormV2(CheckType.Scripted);
      const tab = await screen.findByText('Docs');
      await user.click(tab);
      expect(screen.getByText(SCRIPTED_CHECKS_DOCS_TEXT)).toBeInTheDocument();
    });

    it(`should render the k6 Studio blurb in the docs panel`, async () => {
      const { user } = await renderNewFormV2(CheckType.Scripted);
      const tab = await screen.findByText('Docs');
      await user.click(tab);
      expect(screen.getByText(K6_STUDIO_DOCS_TEXT)).toBeInTheDocument();
    });

    it(`should open the docs panel when clicking on the help button besides the check editor`, async () => {
      const { user } = await renderNewFormV2(CheckType.Scripted);
      const helpButton = await screen.findByText('Need help writing scripts?');
      await user.click(helpButton);
      expect(screen.getByText(SCRIPTED_CHECKS_DOCS_TEXT)).toBeInTheDocument();
    });
  });

  describe('Browser checks', () => {
    it('should render a docs tab for browser checks', async () => {
      const { user } = await renderNewFormV2(CheckType.Browser);
      const tab = await screen.findByText('Docs');
      await user.click(tab);
      expect(screen.getByText(EXPECTED_BROWSER_DOCS_TEXT)).toBeInTheDocument();
    });

    it(`should render the k6 Studio blurb in the docs panel`, async () => {
      const { user } = await renderNewFormV2(CheckType.Scripted);
      const tab = await screen.findByText('Docs');
      await user.click(tab);
      expect(screen.getByText(K6_STUDIO_DOCS_TEXT)).toBeInTheDocument();
    });

    it(`should open the docs panel when clicking on the help button besides the check editor`, async () => {
      const { user } = await renderNewFormV2(CheckType.Browser);
      const helpButton = await screen.findByText('Need help writing scripts?');
      await user.click(helpButton);
      expect(screen.getByText(EXPECTED_BROWSER_DOCS_TEXT)).toBeInTheDocument();
    });
  });
});
