import React, {Component} from 'react';
import {connect} from 'react-redux';
import Vote from '../containers/Vote';
import Results from '../containers/Results';

class GamePane extends Component {

  render() {
    console.log('in render GamePane: '+this.props.voted);
    return (
      this.props.voted ? <Results/> : <Vote/>
    );
  }
}

function mapStateToProps(state) {
  return {
    voted: state.voted,
  };
}

export default connect(mapStateToProps)(GamePane);
