import { describe, it, expect } from 'vitest';
import reducer from '../reducer_results';
import { VOTE, LEAVE_GAME, RESET_SESSION, RESULTS_UPDATED } from '../../actions';

describe('results reducer', () => {
  it('returns [] as initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual([]);
  });

  it('replaces state on RESULTS_UPDATED', () => {
    const results = [{ userName: 'alice', estimateValue: '5' }];
    expect(reducer([], { type: RESULTS_UPDATED, payload: results })).toEqual(results);
  });

  it('overwrites existing results on RESULTS_UPDATED', () => {
    const old = [{ userName: 'alice', estimateValue: '3' }];
    const updated = [
      { userName: 'alice', estimateValue: '3' },
      { userName: 'bob', estimateValue: '8' },
    ];
    expect(reducer(old, { type: RESULTS_UPDATED, payload: updated })).toEqual(updated);
  });

  it('adds optimistic vote on VOTE', () => {
    const action = {
      type: VOTE,
      meta: { userName: 'alice', estimateValue: '5' },
    };
    const result = reducer([], action);
    expect(result).toEqual([{ userName: 'alice', estimateValue: '5' }]);
  });

  it('appends optimistic vote to existing results', () => {
    const existing = [{ userName: 'bob', estimateValue: '3' }];
    const action = {
      type: VOTE,
      meta: { userName: 'alice', estimateValue: '8' },
    };
    const result = reducer(existing, action);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ userName: 'alice', estimateValue: '8' });
  });

  it('does not add optimistic vote on VOTE error', () => {
    const action = {
      type: VOTE,
      error: true,
      payload: new Error('fail'),
      meta: { userName: 'alice', estimateValue: '5' },
    };
    expect(reducer([], action)).toEqual([]);
  });

  it('clears on RESET_SESSION (optimistic)', () => {
    const existing = [{ userName: 'alice', estimateValue: '5' }];
    expect(reducer(existing, { type: RESET_SESSION })).toEqual([]);
  });

  it('clears on LEAVE_GAME', () => {
    const existing = [{ userName: 'alice', estimateValue: '5' }];
    expect(reducer(existing, { type: LEAVE_GAME })).toEqual([]);
  });
});
