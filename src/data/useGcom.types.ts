export enum SubscriptionCodeType {
  FREE = 'grafana-cloud-free',
  FREE_TRIAL = 'grafana-cloud-free-trial',
  PRO = 'grafana-cloud-pro',
  ADVANCED = 'grafana-cloud-advanced',
  SS_ADVANCED = 'grafana-cloud-ss-advanced',
}

export type RelevantInstancesResponse = Pick<InstanceResponse, 'orgId'>;
export type RelevantOrgResponse = Pick<OrgResponse, 'subscriptions'>;

export interface InstanceResponse {
  id: number;
  orgId: number;
  orgSlug: string;
  orgName: string;
  type: string; // grafana
  name: string; // {orgSlug}.grafana.net
  url: string; // https://{orgSlug}.grafana.net
  slug: string; // {orgSlug}
  version: string; // 'steady'
  description: string;
  status: string; // 'active'
  gateway: string;
  createdAt: string; // '2021-06-15T15:33:48Z'
  createdBy: string;
  updatedAt: string; // '2021-06-15T15:33:48Z'
  updatedBy: string;
  trial: number; // 0
  trialExpiresAt: null | string;
  clusterId: number;
  clusterSlug: string; // prod-us-east-0
  clustName: string; // 'prod-us-east-0'
  plan: string; // 'free'
  planName: string; // 'Free'
  billingStartDate: string; // '2021-06-15T15:33:48Z'
  billingEndDate: null;
  billingActiveUsers: number;
  billingGrafanaActiveUsers: number;
  billingOnCallActiveUsers: number;
  currentActiveUsers: number;
  currentActiveAdminUsers: number;
  currentActiveEditorUsers: number;
  currentActiveViewerUsers: number;
  dailyUserCnt: number;
  dailyAdminCnt: number;
  dailyEditorCnt: number;
  dailyViewerCnt: number;
  dashboardCnt: number;
  datasourcesCnts: Record<string, number>;
  userQuota: number;
  dashboardQuo9ta: number; // -1
  alertQuota: number; // -1
  alertCnt: number;
  ssl: boolean;
  customAuth: boolean;
  customDomain: boolean;
  support: boolean;
  runningVersion: string;
  machineLearning: number; // 0
  incident: number; // 0
  k6OrgId: null | number;
  hmInstancePromId: number;
  hmInstancePromUrl: string;
  hmInstancePromName: string;
  hmInstancePromStatus: string; // active
  hmInstancePromCurrentUsage: number;
  hmInstancePromCurrentActiveSeries: number;
  hmInstancePromClusterId: number;
  hmInstanceGraphiteId: number;
  hmInstanceGraphiteUrl: string;
  hmInstanceGraphiteName: string;
  hmInstanceGraphiteType: string;
  hmInstanceGraphiteStatus: string; // active
  hmInstanceGraphiteClusterId: number;
  hmInstanceGraphiteCurrentUsage: number;
  hlInstanceId: number;
  hlInstanceUrl: string;
  hlInstanceName: string;
  hlInstanceStatus: string; // active
  hlInstanceCurrentUsage: number;
  hlInstanceClusterId: number;
  amInstanceId: number;
  amInstanceName: string;
  amInstanceUrl: string;
  amInstanceClusterId: number;
  amInstanceStatus: string; // 'active'
  amInstanceGeneratorUrl: string;
  amInstanceGeneratorUrlDatasource: string;
  htInstanceId: number;
  htInstanceUrl: string;
  htInstanceName: string;
  htInstanceStatus: string; // active
  htInstanceClusterId: number;
  hpInstanceId: number; // stackid
  hpInstanceUrl: string;
  hpInstanceName: string;
  hpInstanceStatus: string; // active
  hpInstanceClusterId: number;
  agentManagementInstanceId: number; // stackid
  agentManagementInstanceUrl: string;
  agentManagementInstanceName: string;
  agentManagementInstanceStatus: string; // active
  agentManagementInstanceClusterId: number;
  regionId: number;
  regionSlug: string; // dev-us-central
  regionPublicName: string;
  provider: string; // gcp
  providerRegion: string; // us-central1
  labels: {};
  links: Array<{ rel: string; href: string }>;
  managedPlugins: [];
}

export interface OrgResponse {
  id: number;
  slug: string;
  name: string;
  url: string;
  createdAt: string; // 2023-02-23T17:33:46.000Z
  createdBy: string;
  updatedAt: string; // 2024-01-31T14:39:40.000Z
  updatedBy: string;
  avatar: string; // custom
  links: Array<{ rel: string; href: string }>;
  isStaff: boolean;
  checksPerMonth: number;
  wpPlan: string;
  hgInstanceLimit: number;
  hmInstanceLimit: number;
  hlInstanceLimit: number;
  userQuota: number; // -1
  supportPlan: string;
  creditApproved: number;
  msaSignedAt: string; // 2023-02-23T18:01:28.000Z
  msaSignedBy: string; // will
  enterprisePlugins: number;
  licenseProducts: [];
  grafanaCloud: number; // 1
  privacy: string; // private
  reseller: string;
  resellerId: null;
  resellerName: null;
  emergencySupport: boolean;
  htUsage: number;
  hlUsage: number;
  hlRetentionUsage: number;
  hmUsage: number;
  hmGraphiteUsage: number;
  hgUsage: number;
  geUsersUsage: number;
  geInstancesUsage: number;
  k6VuhUsage: number;
  k6IPUsage: number;
  irmUsage: number;
  hpUsage: number;
  feO11YUsage: number;
  smUsage: number;
  appO11YUsage: number;
  infraO11YHostsUsage: number;
  infraO11YContainersUsage: number;
  hgGrafanaUsage: number;
  hgOnCallUsage: number;
  hmCurrentUsage: number;
  gcloudMonthlyCost: number;
  awsCustomerId: string;
  awsMarketplaceSupport: number; // 0
  trialStartDate: null;
  trialEndDate: null;
  trialLengthDays: number;
  trialNoticeDate: number;
  cancellationDate: number;
  retainedStackId: number;
  allowGCloudTrial: boolean;
  pluginSignatureType: string; // private
  contractType: string; // 'none';
  contractTypeId: number;
  hgCurrentActiveUsers: number;
  subscriptions: Record<'current', Subscription> & Partial<Record<'next' | 'nextProduct', Subscription | null>>;
  hmAverageDpm: number;
  managedPlugins: [];
}

interface Subscription {
  product: string; // 'grafana-cloud-pro';
  isTrial: boolean;
  startDate: string; // '2023-02-23T17:55:22.000Z';
  endDate: null;
  payload: {};
  plan: string; // 'pro-legacy';
  publicName: string; // 'Pro';
  enterprisePluginsAdded: boolean;
  planBillingCycle: string; // 'monthly';
}

export type UsageBillingDimensions = Record<Product, BillingDimension>;

type Product =
  | 'appO11Y'
  | 'feO11Y'
  | 'geInstances'
  | 'geUsers'
  | 'hg'
  | 'hgPluginUsers'
  | 'hl'
  | 'hlRetention'
  | 'hm'
  | 'hmGraphite'
  | 'hp'
  | 'ht'
  | 'infraO11YContainers'
  | 'infraO11YHosts'
  | 'irm'
  | 'k6IP'
  | 'k6Vuh'
  | 'sm';

interface BillingDimension {
  billingStartDate: string; // '2023-02-01T00:00:00.000Z';
  isEnabled: boolean;
  tiers: Record<string, Tier>;
  units: number;
  usage: {
    billable: number;
    overageAmount: number;
  };
}

interface Tier {
  min: number;
  rate: number;
}
