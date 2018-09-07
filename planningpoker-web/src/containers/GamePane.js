import React, {Component} from 'react';
import {connect} from 'react-redux';
import Loading from '../components/Loading';
import Vote from '../containers/Vote';
import Results from '../containers/Results';

class GamePane extends Component {

  render() {
    return _isUserVoteRecorded(this.props.userName, this.props.results) ? <Results/> :
      this.props.voted ? <Loading/> : <Vote/>
  }
}

function _isUserVoteRecorded(userName, results) {
  return results.map(x => x['userName']).includes(userName)
}

function mapStateToProps(state) {
  return {
    voted: state.voted,
    results: state.results,
  };
}

export default connect(mapStateToProps)(GamePane);
