import React, {Component} from 'react';
import { connect } from 'react-redux';

class Results extends Component {

  render() {
    return (
        <div>
        <h2> Results go here! </h2>
        { this.props.isAdmin ? 'Next item' : 'not admin'}
      </div>
    );
  }
}

function mapStateToProps(state){
  return {
    isAdmin: state.game.isAdmin
  };
}

export default connect(mapStateToProps)(Results)
