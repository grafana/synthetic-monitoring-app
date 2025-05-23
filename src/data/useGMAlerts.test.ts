import { CheckAlertCategory,CheckAlertPublished,CheckAlertType,PrometheusAlertingRule, PrometheusAlertsGroup } from 'types';
import { ALL_PREDEFINED_ALERTS } from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';

import { findRelevantAlertGroups } from './useGMAlerts';

describe('findRelevantAlertGroups', () => {
  const ALERT_NAME = CheckAlertType.ProbeFailedExecutionsTooHigh;
  const CATEGORY = ALL_PREDEFINED_ALERTS.find(a => a.type === ALERT_NAME)?.category || CheckAlertCategory.FailedChecks;

  const MATCHING_RULE: PrometheusAlertingRule = {
    query: 'some_query',
    evaluationTime: 1,
    duration: 300,
    labels: {},
    annotations: { description: 'desc', summary: 'sum' },
    health: 'ok',
    lastEvaluation: 'now',
    state: 'inactive',
    type: 'alerting',
    name: ALERT_NAME,
  };

  const NON_MATCHING_RULE: PrometheusAlertingRule = {
    ...MATCHING_RULE,
    name: 'OtherAlert',
  };

  const GROUP: PrometheusAlertsGroup = {
    evaulationTime: 1,
    file: 'file',
    folderUid: 'grafana-synthetic-monitoring-app',
    interval: 300,
    lastEvaluation: 'now',
    name: 'group',
    rules: [MATCHING_RULE, NON_MATCHING_RULE],
    totals: null,
  };

  const baseAlert = { threshold: 1, created: 1, modified: 1, status: 'ok' };

  test('returns group with only matching rules', () => {
    const alerts: CheckAlertPublished[] = [{ name: ALERT_NAME, ...baseAlert }];
    const result = findRelevantAlertGroups([GROUP], alerts);
    expect(result).toStrictEqual([
      {
        ...GROUP,
        rules: [MATCHING_RULE],
      },
    ]);
  });

  test('returns constructed group with correct category if alert is not in any group', () => {
    const alerts = [{ name: ALERT_NAME, ...baseAlert }];
    const result = findRelevantAlertGroups([], alerts);
    expect(result).toStrictEqual([
      expect.objectContaining({
        name: CATEGORY,
        rules: [expect.objectContaining({ name: ALERT_NAME })],
      }),
    ]);
  });

  test('returns empty array if alerts is empty', () => {
    const result = findRelevantAlertGroups([GROUP], []);
    expect(result).toStrictEqual([]);
  });
}); 
