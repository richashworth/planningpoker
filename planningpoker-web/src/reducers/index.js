import { combineReducers } from 'redux'
import GameReducer from './reducer_game'
import ResultsReducer from './reducer_results'
import UsersReducer from './reducer_users'
import SpectatorsReducer from './reducer_spectators'
import VoteReducer from './reducer_vote'
import NotificationReducer from './reducer_notification'
import RoundsReducer from './reducer_rounds'
import ConsensusReducer from './reducer_consensus'

const rootReducer = combineReducers({
  game: GameReducer,
  results: ResultsReducer,
  users: UsersReducer,
  spectators: SpectatorsReducer,
  voted: VoteReducer,
  notification: NotificationReducer,
  rounds: RoundsReducer,
  consensus: ConsensusReducer,
})

export default rootReducer
