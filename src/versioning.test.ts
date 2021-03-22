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
  return pluginJson.dependencies.grafanaVersion;
};

const majorMinorVersion = (version: string) => {
  return version.split('.').slice(0, 1).join('.');
};

it('plugin json compatibility should reflack whats in the package json dependencies', () => {
  const { data, runtime, toolkit, ui } = getGrafanaDependencyVersion();
  const compatibleVersion = majorMinorVersion(getCompatibleGrafanaVersion());
  expect(majorMinorVersion(data)).toEqual(compatibleVersion);
  expect(majorMinorVersion(runtime)).toEqual(compatibleVersion);
  expect(majorMinorVersion(toolkit)).toEqual(compatibleVersion);
  expect(majorMinorVersion(ui)).toEqual(compatibleVersion);
});

it('has consistent grafana dependency versions', () => {
  const { data, runtime, toolkit, ui } = getGrafanaDependencyVersion();
  expect(runtime).toEqual(data);
  expect(toolkit).toEqual(data);
  expect(ui).toEqual(data);
});
