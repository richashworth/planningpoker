import { describe, it, expect } from 'vitest';
import reducer from '../reducer_game';
import { CREATE_GAME, GAME_CREATED, JOIN_GAME, LEAVE_GAME, USER_REGISTERED } from '../../actions';

// Note: the reducer's initialGameState wraps everything in { game: { ... } }.
// This is a legacy quirk — combineReducers maps state.game to this reducer,
// so properties like isAdmin live at the top level of this reducer's state.
const initialState = {
  game: { playerName: '', sessionId: '', isAdmin: false, isRegistered: false },
};

describe('game reducer', () => {
  it('returns initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('sets playerName and sessionId on CREATE_GAME', () => {
    const action = {
      type: CREATE_GAME,
      payload: { data: 'abc12345' },
      meta: { userName: 'alice' },
    };
    const state = reducer(initialState, action);
    expect(state.playerName).toBe('alice');
    expect(state.sessionId).toBe('abc12345');
  });

  it('sets isAdmin and isRegistered on GAME_CREATED', () => {
    const state = reducer(initialState, { type: GAME_CREATED });
    expect(state.isAdmin).toBe(true);
    expect(state.isRegistered).toBe(true);
  });

  it('sets isRegistered on USER_REGISTERED', () => {
    const state = reducer(initialState, { type: USER_REGISTERED });
    expect(state.isRegistered).toBe(true);
  });

  it('sets playerName and sessionId on JOIN_GAME', () => {
    const action = {
      type: JOIN_GAME,
      meta: { userName: 'bob', sessionId: 'xyz98765' },
    };
    const state = reducer(initialState, action);
    expect(state.playerName).toBe('bob');
    expect(state.sessionId).toBe('xyz98765');
  });

  it('resets to initial state on LEAVE_GAME', () => {
    const active = {
      playerName: 'alice',
      sessionId: 'abc12345',
      isAdmin: true,
      isRegistered: true,
    };
    expect(reducer(active, { type: LEAVE_GAME })).toEqual(initialState);
  });
});
