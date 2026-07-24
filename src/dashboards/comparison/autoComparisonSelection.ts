export const AUTO_COMPARISON_PRESET_IDS = ['30d', '21d', '14d', '7d', '24h'] as const;

export type AutoComparisonPresetId = (typeof AUTO_COMPARISON_PRESET_IDS)[number];

export type AutoCandidateOutcome = 'available' | 'partial' | 'empty' | 'outside-retention' | 'query-error';

export type AutoComparisonSelectionState =
  | {
      status: 'finding';
      candidateIndex: number;
      candidatePresetId: AutoComparisonPresetId;
      sawQueryError: boolean;
    }
  | {
      status: 'resolved';
      presetId: AutoComparisonPresetId;
    }
  | {
      status: 'no-data' | 'query-error';
    };

export function createAutoComparisonSelection(): AutoComparisonSelectionState {
  return {
    status: 'finding',
    candidateIndex: 0,
    candidatePresetId: AUTO_COMPARISON_PRESET_IDS[0],
    sawQueryError: false,
  };
}

export function advanceAutoComparisonSelection(
  state: AutoComparisonSelectionState,
  outcome: AutoCandidateOutcome
): AutoComparisonSelectionState {
  if (state.status !== 'finding') {
    return state;
  }

  if (outcome === 'available' || outcome === 'partial') {
    return {
      status: 'resolved',
      presetId: state.candidatePresetId,
    };
  }

  const sawQueryError = state.sawQueryError || outcome === 'query-error';
  const candidateIndex = state.candidateIndex + 1;
  const candidatePresetId = AUTO_COMPARISON_PRESET_IDS[candidateIndex];

  if (!candidatePresetId) {
    return { status: sawQueryError ? 'query-error' : 'no-data' };
  }

  return {
    status: 'finding',
    candidateIndex,
    candidatePresetId,
    sawQueryError,
  };
}
