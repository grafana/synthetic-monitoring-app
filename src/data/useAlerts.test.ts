import { PrometheusAlertingRule, PrometheusAlertsGroup } from 'types';

import { findRelevantAlertGroups } from './useAlerts';

// TODO: introduce an object factory like fishery

const RELEVANT_RULE: PrometheusAlertingRule = {
  query: 'instance_job_severity:probe_success:mean5m{alert_sensitivity="high"}',
  evaluationTime: 1,
  duration: 300,
  labels: {},
  annotations: {
    description: 'This is a high sensitivity alert',
    summary: 'High sensitivity alert',
  },
  health: `ok`,
  lastEvaluation: `some time ago`,
  state: `inactive`,
  type: `alerting`,
  name: `relevant`,
};

const NOT_RELEVANT_RULE: PrometheusAlertingRule = {
  query: 'instance_job_severity:probe_success:mean5m{alert_sensitivity="notme"}',
  evaluationTime: 1,
  duration: 300,
  labels: {},
  annotations: {
    description: 'This is a high sensitivity alert',
    summary: 'High sensitivity alert',
  },
  health: `ok`,
  lastEvaluation: `some time ago`,
  state: `inactive`,
  type: `alerting`,
  name: `relevant`,
};

const RELEVANT_GROUP: PrometheusAlertsGroup = {
  evaulationTime: 1,
  file: `test`,
  folderUid: `default`,
  interval: 300,
  lastEvaluation: `some time ago`,
  name: `group1`,
  rules: [RELEVANT_RULE, NOT_RELEVANT_RULE],
  totals: null,
};

const NOT_RELEVANT_GROUP: PrometheusAlertsGroup = {
  evaulationTime: 1,
  file: `test`,
  folderUid: `default`,
  interval: 300,
  lastEvaluation: `some time ago`,
  name: `group1`,
  rules: [NOT_RELEVANT_RULE],
  totals: null,
};

describe('findRelevantAlertGroups', () => {
  test(`returns empty array if no relevant alerts`, () => {
    const alertFilter = (alert: any) => {
      return alert.query.includes(`alert_sensitivity="findnothingplz"`);
    };

    const result = findRelevantAlertGroups([RELEVANT_GROUP, NOT_RELEVANT_GROUP], alertFilter);
    expect(result).toStrictEqual([]);
  });

  test(`returns relevant alert groups`, () => {
    const alertFilter = (alert: any) => {
      return alert.query.includes(`alert_sensitivity="high"`);
    };

    const result = findRelevantAlertGroups([RELEVANT_GROUP, NOT_RELEVANT_GROUP], alertFilter);
    expect(result).toStrictEqual([
      {
        ...RELEVANT_GROUP,
        rules: [RELEVANT_RULE],
      },
    ]);
  });
});
