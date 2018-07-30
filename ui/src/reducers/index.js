import { combineReducers } from 'redux';
import GameReducer from './reducer_game';

//define what pieces of state each reducer manages
const rootReducer = combineReducers({
  game: GameReducer
});

export default rootReducer;
