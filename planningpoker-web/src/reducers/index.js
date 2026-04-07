import {combineReducers} from 'redux';
import GameReducer from './reducer_game';
import ResultsReducer from './reducer_results';
import UsersReducer from './reducer_users';
import VoteReducer from './reducer_vote';
import NotificationReducer from './reducer_notification';

//keys define what pieces of state each reducer manages
const rootReducer = combineReducers({
  game: GameReducer,
  results: ResultsReducer,
  users: UsersReducer,
  voted: VoteReducer,
  notification: NotificationReducer
});

export default rootReducer;
