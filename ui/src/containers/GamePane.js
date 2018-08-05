import React, {Component} from 'react';
import {connect} from 'react-redux';
import Vote from '../containers/Vote';
import Results from '../containers/Results';

class PlayGame extends Component {

  render() {
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

export default connect(mapStateToProps)(PlayGame);
