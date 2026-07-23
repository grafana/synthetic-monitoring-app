import {
  CheckHealthModel,
  HealthEvidence,
  HealthState,
  MetricAlertModel,
  MetricHealthModel,
  MetricTrendModel,
} from './checkHealth.types';
import type { AppTimeRangeMode } from 'contexts/AppTimeProvider.utils';

const STATE_RANK: Record<Exclude<HealthState, 'unknown'>, number> = {
  healthy: 0,
  degraded: 1,
  unhealthy: 2,
};

const UNSUPPORTED_ALERT: MetricAlertModel = { state: 'unsupported' };

function isKnownState(state: HealthState): state is Exclude<HealthState, 'unknown'> {
  return state !== 'unknown';
}

export function worstKnownState(evidence: HealthEvidence[]): HealthState {
  const knownStates = evidence.map((item) => item.state).filter(isKnownState);

  if (knownStates.length === 0) {
    return 'unknown';
  }

  return knownStates.reduce<Exclude<HealthState, 'unknown'>>(
    (worst, state) => (STATE_RANK[state] > STATE_RANK[worst] ? state : worst),
    'healthy'
  );
}

function sortEvidence(left: HealthEvidence, right: HealthEvidence) {
  const leftRank = isKnownState(left.state) ? STATE_RANK[left.state] : -1;
  const rightRank = isKnownState(right.state) ? STATE_RANK[right.state] : -1;

  return rightRank - leftRank || right.explanationPriority - left.explanationPriority;
}

export function resolveCheckHealth({
  metricIds,
  evidence,
  qualifiers = [],
  alerts = {},
  liveIncidentCount = 0,
  rangeMode,
  evaluationAt,
  trends = {},
}: {
  metricIds: string[];
  evidence: HealthEvidence[];
  qualifiers?: string[];
  alerts?: Record<string, MetricAlertModel>;
  liveIncidentCount?: number;
  rangeMode: AppTimeRangeMode;
  evaluationAt: number;
  trends?: Record<string, MetricTrendModel>;
}): CheckHealthModel {
  const evaluationEvidence = evidence.filter((item) => item.scope === 'evaluation');
  const rangeEvidence = evidence.filter((item) => item.scope === 'range');
  const metrics = Object.fromEntries(
    metricIds.map<[string, MetricHealthModel]>((metricId) => {
      const metricEvidence = evidence.filter((item) => item.metricId === metricId);
      const metricEvaluationEvidence = metricEvidence.filter((item) => item.scope === 'evaluation');
      const metricRangeEvidence = metricEvidence.filter((item) => item.scope === 'range');
      const state = worstKnownState(metricEvaluationEvidence);

      return [
        metricId,
        {
          state,
          rangeState: metricRangeEvidence.length > 0 ? worstKnownState(metricRangeEvidence) : state,
          evidence: [...metricEvidence].sort(sortEvidence),
          hasPartialEvidence: metricEvidence.some((item) => item.state === 'unknown'),
          alert: alerts[metricId] ?? UNSUPPORTED_ALERT,
          trend: trends[metricId],
        },
      ];
    })
  );
  const sortedEvidence = [...evidence].sort(sortEvidence);
  const sortedEvaluationEvidence = [...evaluationEvidence].sort(sortEvidence);
  const sortedRangeEvidence = [...rangeEvidence].sort(sortEvidence);
  const state = worstKnownState(evaluationEvidence);
  const rangeState = rangeEvidence.length > 0 ? worstKnownState(rangeEvidence) : state;

  return {
    state,
    rangeState,
    rangeMode,
    evaluationAt,
    metrics,
    evidence: sortedEvidence,
    compactReasons: sortedEvaluationEvidence.filter((item) => item.state === state).slice(0, 2),
    rangeReasons: sortedRangeEvidence.filter((item) => item.state === rangeState).slice(0, 2),
    qualifiers,
    hasPartialEvidence: evidence.some((item) => item.state === 'unknown'),
    liveIncidentCount,
  };
}
