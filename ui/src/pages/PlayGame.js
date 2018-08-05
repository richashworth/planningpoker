import React, {Component} from 'react';
import {connect} from 'react-redux';
import Vote from '../containers/Vote';
import Results from '../containers/Results';
import SockJsClient from 'react-stomp';
import {resultsUpdated} from '../actions';

class PlayGame extends Component {

  componentDidMount(){
    if(!this.props.isUserRegistered) this.props.history.push('/')
  }

  render() {
    return (
      <div>
        <SockJsClient url='http://localhost:9000/stomp' topics={[`/topic/results/${this.props.sessionId}`]}
          onMessage= {(msg) => {
            console.log('msg received in sock')
            this.props.resultsUpdated(msg, this.props.playerName);
          }}/>
        {this.props.voted ? <Results/> : <Vote/>}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    voted: state.voted,
    playerName: state.game.playerName,
    sessionId: state.game.sessionId,
    isUserRegistered: state.game.isRegistered,
  };
}

export default connect(mapStateToProps, {resultsUpdated})(PlayGame);
