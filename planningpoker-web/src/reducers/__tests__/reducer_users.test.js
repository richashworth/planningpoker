import { describe, it, expect } from 'vitest';
import reducer from '../reducer_users';
import { USERS_UPDATED, LEAVE_GAME } from '../../actions';

describe('users reducer', () => {
  it('returns [] as initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual([]);
  });

  it('replaces state on USERS_UPDATED', () => {
    const users = ['alice', 'bob'];
    expect(reducer([], { type: USERS_UPDATED, payload: users })).toEqual(users);
  });

  it('clears on LEAVE_GAME', () => {
    expect(reducer(['alice'], { type: LEAVE_GAME })).toEqual([]);
  });
});
