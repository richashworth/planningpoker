import {combineReducers} from 'redux';
import GameReducer from './reducer_game';
import ResultsReducer from './reducer_results';

//keys define what pieces of state each reducer manages
const rootReducer = combineReducers({
  game: GameReducer,
  results: ResultsReducer
});

export default rootReducer;
