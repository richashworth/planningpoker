import React, {Component} from 'react';
import {connect} from 'react-redux';
import Vote from '../containers/Vote';
import Results from '../containers/Results';

class GamePane extends Component {

  render() {
    return (
      this.props.voted ? <Results/> : <Vote/>
    );
  }
}

function mapStateToProps(state) {
  return {
    voted: state.voted,
    results: state.results,
    userName: state.game.playerName,
  };
}

export default connect(mapStateToProps)(GamePane);
