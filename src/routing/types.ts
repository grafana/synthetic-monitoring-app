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
  ReliabilityInbox = 'reliability-inbox',
  Redirect = 'redirect',
  Scene = 'scene',
}

export const AUTO_INITIALIZE_ROUTES = [
  AppRoutes.Checks,
  AppRoutes.ChooseCheckGroup,
  AppRoutes.NewCheck,
  AppRoutes.Probes,
  AppRoutes.NewProbe,
  AppRoutes.Alerts,
  AppRoutes.ReliabilityInbox,
] as const;

export type AutoInitializeRoute = (typeof AUTO_INITIALIZE_ROUTES)[number];
