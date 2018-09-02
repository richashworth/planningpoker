import React, {Component} from 'react';
import {connect} from 'react-redux';
import GamePane from '../containers/GamePane';
import SockJsClient from 'react-stomp';
import {resultsUpdated, usersUpdated} from '../actions';

class PlayGame extends Component {

  componentDidMount() {
    if (!this.props.isUserRegistered) {
      this.props.history.push('/')
    }
  }

  _handleMessage(msg) {
    switch (msg.type) {
      case 'RESULTS_MESSAGE':
        return this.props.resultsUpdated(msg.payload, this.props.playerName);
      case 'USERS_MESSAGE':
        return this.props.usersUpdated(msg.payload);
      case 'ITEMS_MESSAGE':
        return '';
      default:
        return '';
    }
  }

  render() {
    return (
      <div>
        <SockJsClient
          url='http://localhost:9000/stomp'
          topics={[
            `/topic/items/${this.props.sessionId}`,
            `/topic/results/${this.props.sessionId}`,
            `/topic/users/${this.props.sessionId}`,
          ]}
          onMessage={(msg) => this._handleMessage(msg)}/>
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

export default connect(mapStateToProps, {resultsUpdated, usersUpdated})(PlayGame);
