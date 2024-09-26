import { RelevantInstancesResponse, RelevantOrgResponse, SubscriptionCodeType } from 'data/useGcom.types';

const ORG_ID = 1234;

export const INSTANCES_RESPONSE: RelevantInstancesResponse = {
  orgId: ORG_ID,
};

export const ORG_RESPONSE: RelevantOrgResponse = {
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
