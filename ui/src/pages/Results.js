import React, {Component} from 'react';
import { connect } from 'react-redux';

class Results extends Component {

  render() {

    const adminButton = <button type="button" className="btn btn-primary btn-lg">
      Next Item
    </button>

    return (
        <div>
        <h2> Results go here! </h2>
        { this.props.isAdmin ? adminButton : '' }
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
