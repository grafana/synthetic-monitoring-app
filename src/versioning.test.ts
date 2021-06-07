//@ts-ignore
import packageJson from '../package.json';
//@ts-ignore
import pluginJson from './plugin.json';

const getGrafanaDependencyVersion = () => {
  const data = packageJson.devDependencies['@grafana/data'];
  const runtime = packageJson.devDependencies['@grafana/runtime'];
  const toolkit = packageJson.devDependencies['@grafana/toolkit'];
  const ui = packageJson.devDependencies['@grafana/ui'];
  return { data, runtime, toolkit, ui };
};

const getCompatibleGrafanaVersion = () => {
  const grafanaDependency = pluginJson.dependencies.grafanaDependency.replace('>=', '');
  const grafanaVersion = pluginJson.dependencies.grafanaVersion;
  return {
    grafanaDependency,
    grafanaVersion,
  };
};

const majorMinorVersion = (version: string) => {
  return version.split('.').slice(0, 2).join('.');
};

it('plugin json compatibility should reflact whats in the package json dependencies', () => {
  const { data, runtime, toolkit, ui } = getGrafanaDependencyVersion();
  const { grafanaVersion, grafanaDependency } = getCompatibleGrafanaVersion();
  const compatibleVersion = majorMinorVersion(grafanaVersion);
  expect(compatibleVersion).toEqual(majorMinorVersion(grafanaDependency));
  expect(majorMinorVersion(data)).toEqual(compatibleVersion);
  expect(majorMinorVersion(runtime)).toEqual(compatibleVersion);
  expect(majorMinorVersion(toolkit)).toEqual(compatibleVersion);
  expect(majorMinorVersion(ui)).toEqual(compatibleVersion);
});

it('has consistent grafana dependency versions', () => {
  const { data, runtime, toolkit, ui } = getGrafanaDependencyVersion();
  expect(runtime).toEqual(data);
  expect(majorMinorVersion(toolkit)).toEqual(majorMinorVersion(data));
  expect(ui).toEqual(data);
});
