export enum AppRoutes {
  Alerts = 'alerts',
  CheckDashboard = 'checks/:id',
  Checks = 'checks',
  ChooseCheckGroup = 'checks/choose-type',
  Config = 'config', // config (index)
  EditCheck = 'checks/:id/edit',
  ViewProbe = 'probes/:id',
  EditProbe = 'probes/:id/edit',
  Home = '', // the root URL
  NewCheck = 'checks/new',
  NewProbe = 'probes/new',
  Probes = 'probes',
  Redirect = 'redirect',
  Scene = 'scene',
  LegacyHome = 'home',
}
