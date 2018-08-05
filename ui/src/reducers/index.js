import {combineReducers} from 'redux';
import GameReducer from './reducer_game';
import ResultsReducer from './reducer_results';
import VoteReducer from './reducer_vote';

//keys define what pieces of state each reducer manages
const rootReducer = combineReducers({
  game: GameReducer,
  results: ResultsReducer,
  voted: VoteReducer
});

export default rootReducer;
