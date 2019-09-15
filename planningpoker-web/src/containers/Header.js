import React, {Component} from 'react';
import {Navbar} from 'react-bootstrap';
import {leaveGame} from '../actions';
import {connect} from 'react-redux';
import {withRouter} from 'react-router-dom';
import _ from 'lodash';

import '../styles/Header.css';

class Header extends Component {

  render() {
    return (
      <Navbar collapseOnSelect className="navbar-top">
        <Navbar.Header>
          <Navbar.Brand>
            planning poker
          </Navbar.Brand>
          <Navbar.Toggle/>
        </Navbar.Header>
        {this.props.sessionId ?
          <Navbar.Collapse>
            <Navbar.Text pullRight className='navbar-header-text'>
              <button onClick={() => this.props.leaveGame(this.props.playerName, this.props.sessionId, () => {
                this.props.history.push('/')
              })}>
                Log Out
              </button>
            </Navbar.Text>
            < Navbar.Text pullRight className='navbar-header-text'>
              {`Session ${this.props.sessionId}`}
            </Navbar.Text>
            <Navbar.Text pullRight className='navbar-header-text'>
              {_.startCase(this.props.playerName)}
            </Navbar.Text>
          </Navbar.Collapse>
          : ''}
      </Navbar>
    );
  }
}

function mapStateToProps(state) {
  return {
    sessionId: state.game.sessionId,
    playerName: state.game.playerName,
  };
}

export default withRouter(connect(mapStateToProps, {leaveGame})(Header));
