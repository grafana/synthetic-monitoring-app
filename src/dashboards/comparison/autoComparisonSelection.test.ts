import {
  advanceAutoComparisonSelection,
  AUTO_COMPARISON_PRESET_IDS,
  createAutoComparisonSelection,
} from './autoComparisonSelection';

describe('automatic comparison selection', () => {
  it('starts with the approved longest-first candidate order', () => {
    expect(AUTO_COMPARISON_PRESET_IDS).toEqual(['30d', '21d', '14d', '7d', '24h']);
    expect(createAutoComparisonSelection()).toEqual({
      status: 'finding',
      candidateIndex: 0,
      candidatePresetId: '30d',
      sawQueryError: false,
    });
  });

  it.each(['available', 'partial'] as const)('resolves the active candidate when coverage is %s', (outcome) => {
    expect(advanceAutoComparisonSelection(createAutoComparisonSelection(), outcome)).toEqual({
      status: 'resolved',
      presetId: '30d',
    });
  });

  it.each(['empty', 'outside-retention'] as const)('advances past an %s candidate', (outcome) => {
    expect(advanceAutoComparisonSelection(createAutoComparisonSelection(), outcome)).toEqual({
      status: 'finding',
      candidateIndex: 1,
      candidatePresetId: '21d',
      sawQueryError: false,
    });
  });

  it('continues after a query error and remembers that availability was uncertain', () => {
    expect(advanceAutoComparisonSelection(createAutoComparisonSelection(), 'query-error')).toEqual({
      status: 'finding',
      candidateIndex: 1,
      candidatePresetId: '21d',
      sawQueryError: true,
    });
  });

  it('reports no data after exhausting only empty candidates', () => {
    const exhausted = AUTO_COMPARISON_PRESET_IDS.reduce(
      (state) => advanceAutoComparisonSelection(state, 'empty'),
      createAutoComparisonSelection()
    );

    expect(exhausted).toEqual({ status: 'no-data' });
  });

  it('reports a query error after exhausting a sequence containing an error', () => {
    let state = advanceAutoComparisonSelection(createAutoComparisonSelection(), 'query-error');

    for (let index = 1; index < AUTO_COMPARISON_PRESET_IDS.length; index++) {
      state = advanceAutoComparisonSelection(state, 'empty');
    }

    expect(state).toEqual({ status: 'query-error' });
  });

  it('allows a later candidate to resolve after an earlier query error', () => {
    const afterError = advanceAutoComparisonSelection(createAutoComparisonSelection(), 'query-error');

    expect(advanceAutoComparisonSelection(afterError, 'partial')).toEqual({
      status: 'resolved',
      presetId: '21d',
    });
  });
});
