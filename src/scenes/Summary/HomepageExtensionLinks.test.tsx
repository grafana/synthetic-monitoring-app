import React from 'react';
import { usePluginComponents, usePluginLinks } from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { HomepageExtensionLinks } from './HomepageExtensionLinks';
import { EXTENSION_POINTS } from './SummaryDashboard.constants';

const usePluginLinksMock = usePluginLinks as jest.MockedFunction<typeof usePluginLinks>;
const usePluginComponentsMock = usePluginComponents as jest.MockedFunction<typeof usePluginComponents>;

describe('HomepageExtensionLinks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePluginLinksMock.mockReturnValue({ links: [], isLoading: false });
    usePluginComponentsMock.mockReturnValue({ components: [], isLoading: false });
  });

  it('renders nothing when no extensions are registered', async () => {
    render(<HomepageExtensionLinks />);
    await screen.findByText(() => true).catch(() => null);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls usePluginLinks and usePluginComponents with the correct extension point ID', async () => {
    render(<HomepageExtensionLinks />);
    await screen.findByText(() => true).catch(() => null);

    expect(usePluginLinksMock).toHaveBeenCalledWith({
      extensionPointId: EXTENSION_POINTS.HOME_CTA,
    });
    expect(usePluginComponentsMock).toHaveBeenCalledWith({
      extensionPointId: EXTENSION_POINTS.HOME_CTA,
    });
  });

  it('renders links when extension links are registered', async () => {
    usePluginLinksMock.mockReturnValue({
      links: [
        {
          id: 'signup-cta',
          pluginId: 'grafana-cloud-signup-cta-app',
          title: 'Sign up to Grafana Cloud',
          description: 'Create your free Grafana Cloud account',
          path: 'https://grafana.com/auth/sign-up/create-user',
          openInNewTab: true,
          category: '',
          icon: 'external-link-alt',
          onClick: jest.fn(),
        },
      ],
      isLoading: false,
    });

    render(<HomepageExtensionLinks />);

    const link = await screen.findByRole('link', { name: 'Sign up to Grafana Cloud' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://grafana.com/auth/sign-up/create-user');
  });

  it('renders multiple links when several are registered', async () => {
    usePluginLinksMock.mockReturnValue({
      links: [
        {
          id: 'link-1',
          pluginId: 'plugin-a',
          title: 'First CTA',
          description: 'First description',
          path: '/first',
          openInNewTab: false,
          category: '',
          icon: 'link',
          onClick: jest.fn(),
        },
        {
          id: 'link-2',
          pluginId: 'plugin-b',
          title: 'Second CTA',
          description: 'Second description',
          path: '/second',
          openInNewTab: true,
          category: '',
          icon: 'external-link-alt',
          onClick: jest.fn(),
        },
      ],
      isLoading: false,
    });

    render(<HomepageExtensionLinks />);

    expect(await screen.findByRole('link', { name: 'First CTA' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Second CTA' })).toBeInTheDocument();
  });

  it('renders component extensions when registered', async () => {
    const MockCtaComponent = () => <div>Custom CTA content</div>;
    Object.assign(MockCtaComponent, { meta: { pluginId: 'grafana-custom-cta-plugin' } });

    usePluginComponentsMock.mockReturnValue({
      components: [MockCtaComponent as any],
      isLoading: false,
    });

    render(<HomepageExtensionLinks />);

    expect(await screen.findByText('Custom CTA content')).toBeInTheDocument();
  });

  it('renders both links and components together', async () => {
    usePluginLinksMock.mockReturnValue({
      links: [
        {
          id: 'link-1',
          pluginId: 'plugin-a',
          title: 'Link CTA',
          description: 'A link',
          path: '/link',
          openInNewTab: false,
          category: '',
          icon: 'link',
          onClick: jest.fn(),
        },
      ],
      isLoading: false,
    });

    const MockCtaComponent = () => <div>Component CTA</div>;
    Object.assign(MockCtaComponent, { meta: { pluginId: 'grafana-custom-cta-plugin' } });

    usePluginComponentsMock.mockReturnValue({
      components: [MockCtaComponent as any],
      isLoading: false,
    });

    render(<HomepageExtensionLinks />);

    expect(await screen.findByRole('link', { name: 'Link CTA' })).toBeInTheDocument();
    expect(screen.getByText('Component CTA')).toBeInTheDocument();
  });
});
