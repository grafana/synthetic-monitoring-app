import { RelevantInstanceResponse, RelevantOrgResponse, SubscriptionCodeType } from 'data/useGcom.types';

const ORG_ID = 1234;

export const INSTANCE_RESPONSE: RelevantInstanceResponse = {
  orgId: ORG_ID,
};

export const ORG_RESPONSE_FREE: RelevantOrgResponse = {
  subscriptions: {
    current: {
      endDate: null,
      enterprisePluginsAdded: false,
      isTrial: false,
      payload: {},
      plan: 'free',
      planBillingCycle: 'monthly',
      product: SubscriptionCodeType.FREE,
      publicName: 'Free',
      startDate: '2023-02-23T17:55:22.000Z',
    },
  },
};

export const ORG_RESPONSE: RelevantOrgResponse = {
  subscriptions: {
    current: {
      endDate: null,
      enterprisePluginsAdded: false,
      isTrial: false,
      payload: {},
      plan: 'pro-legacy',
      planBillingCycle: 'monthly',
      product: SubscriptionCodeType.PRO,
      publicName: 'Pro',
      startDate: '2023-02-23T17:55:22.000Z',
    },
  },
};
