import React, {Component} from 'react';
import {connect} from 'react-redux';
import GamePane from '../containers/GamePane';
import SockJsClient from 'react-stomp';
import {resultsUpdated} from '../actions';

class PlayGame extends Component {

  componentDidMount() {
    if(!this.props.isUserRegistered) {
      this.props.history.push('/')
    }
  }

  render() {
    return (
      <div>
        <SockJsClient
          url='http://localhost:9000/stomp'
          topics={[`/topic/results/${this.props.sessionId}`]}
          onMessage= {(msg) => this.props.resultsUpdated(msg, this.props.playerName)}/>
        <GamePane/>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    playerName: state.game.playerName,
    sessionId: state.game.sessionId,
    isUserRegistered: state.game.isRegistered,
  };
}

export default connect(mapStateToProps, {resultsUpdated})(PlayGame);
