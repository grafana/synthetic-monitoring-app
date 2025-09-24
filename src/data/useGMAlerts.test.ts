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

  const RULE_5M: PrometheusAlertingRule = {
    ...MATCHING_RULE,
    name: `${ALERT_NAME} [5m]`,
  };

  const RULE_10M: PrometheusAlertingRule = {
    ...MATCHING_RULE,
    name: `${ALERT_NAME} [10m]`,
  };

  const RULE_30M: PrometheusAlertingRule = {
    ...MATCHING_RULE,
    name: `${ALERT_NAME} [30m]`,
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

  test.each([
    ['HTTP', CheckAlertType.HTTPRequestDurationTooHighAvg],
    ['PING', CheckAlertType.PingRequestDurationTooHighAvg],
    ['DNS', CheckAlertType.DNSRequestDurationTooHighAvg],
  ])('handles %s latency alerts correctly', (checkTypeName, alertType) => {
    const latencyCategory = ALL_PREDEFINED_ALERTS.find(a => a.type === alertType)?.category || CheckAlertCategory.Latency;
    
    const alerts = [{ name: alertType, ...baseAlert }];
    const result = findRelevantAlertGroups([], alerts);
    
    expect(result).toStrictEqual([
      expect.objectContaining({
        name: latencyCategory,
        rules: [expect.objectContaining({ name: alertType })],
      }),
    ]);
  });

  describe('period-based alert matching', () => {
    const GROUP_5M: PrometheusAlertsGroup = {
      evaulationTime: 1,
      file: 'Grafana Synthetic Monitoring',
      folderUid: 'grafana-synthetic-monitoring-app',
      interval: 300,
      lastEvaluation: 'now',
      name: 'Failed Checks [5m]',
      rules: [RULE_5M],
      totals: null,
    };

    const GROUP_10M: PrometheusAlertsGroup = {
      ...GROUP_5M,
      name: 'Failed Checks [10m]',
      rules: [RULE_10M],
    };

    const GROUP_30M: PrometheusAlertsGroup = {
      ...GROUP_5M,
      name: 'Failed Checks [30m]',
      rules: [RULE_30M],
    };

    test('matches exact period when period is specified', () => {
      const alerts: CheckAlertPublished[] = [{ 
        name: ALERT_NAME, 
        period: '5m',
        ...baseAlert 
      }];
      
      // Test the scenario from the escalation: 10m group comes first in array
      const groups = [GROUP_10M, GROUP_30M, GROUP_5M];
      const result = findRelevantAlertGroups(groups, alerts);
      
      expect(result).toStrictEqual([
        {
          ...GROUP_5M,
          rules: [RULE_5M],
        },
      ]);
    });

    test('matches 10m period correctly even when 5m exists', () => {
      const alerts: CheckAlertPublished[] = [{ 
        name: ALERT_NAME, 
        period: '10m',
        ...baseAlert 
      }];
      
      const groups = [GROUP_5M, GROUP_10M, GROUP_30M];
      const result = findRelevantAlertGroups(groups, alerts);
      
      expect(result).toStrictEqual([
        {
          ...GROUP_10M,
          rules: [RULE_10M],
        },
      ]);
    });

    test('handles alert without period (backward compatibility)', () => {
      const alerts: CheckAlertPublished[] = [{ 
        name: ALERT_NAME,
        ...baseAlert 
      }];
      
      const groups = [GROUP];
      const result = findRelevantAlertGroups(groups, alerts);
      
      expect(result).toStrictEqual([
        {
          ...GROUP,
          rules: [MATCHING_RULE],
        },
      ]);
    });

    test('creates dummy group when no matching period rule exists', () => {
      const alerts: CheckAlertPublished[] = [{ 
        name: ALERT_NAME, 
        period: '15m', // This period doesn't exist in any group
        ...baseAlert 
      }];
      
      const groups = [GROUP_5M, GROUP_10M, GROUP_30M];
      const result = findRelevantAlertGroups(groups, alerts);
      
      expect(result).toStrictEqual([
        expect.objectContaining({
          name: CATEGORY,
          rules: [expect.objectContaining({ name: ALERT_NAME })],
        }),
      ]);
    });
  });
}); 
