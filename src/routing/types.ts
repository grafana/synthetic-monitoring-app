export enum AppRoutes {
  Alerts = 'alerts',
  CheckDashboard = 'checks/:id',
  Checks = 'checks',
  ChooseCheckGroup = 'checks/choose-type',
  Config = 'config', // config (index)
  EditCheck = 'checks/:id/edit',
  ViewProbe = 'probes/:id',
  EditProbe = 'probes/:id/edit',
  Home = 'home',
  NewCheck = 'checks/new',
  NewProbe = 'probes/new',
  Probes = 'probes',
  Redirect = 'redirect',
  Scene = 'scene',
}

export const AUTO_INITIALIZE_ROUTES = [AppRoutes.NewCheck, AppRoutes.ChooseCheckGroup, AppRoutes.NewProbe] as const;

export type AutoInitializeRoute = (typeof AUTO_INITIALIZE_ROUTES)[number];
