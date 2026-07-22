import pluginJson from './plugin.json';

type PluginJsonWithExtensions = typeof pluginJson & {
  extensions?: {
    addedComponents?: Array<{
      targets: string[];
      title: string;
      description?: string;
    }>;
  };
};

describe('plugin component extensions', () => {
  it('declares the Testing & synthetics landing page registration in the plugin manifest', () => {
    const manifest = pluginJson as PluginJsonWithExtensions;

    expect(manifest.extensions?.addedComponents).toContainEqual({
      targets: ['grafana/dynamic/nav-landing-page/nav-id-testing-and-synthetics/v1'],
      title: 'Testing & synthetics landing page',
      description: 'Disambiguation landing page for Synthetic Monitoring and Grafana Cloud k6',
    });
  });
});
