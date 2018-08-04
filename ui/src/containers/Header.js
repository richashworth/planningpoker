import React, {Component} from 'react';
import { Navbar, Nav} from 'react-bootstrap';
import {connect} from 'react-redux';

import '../styles/Header.css';

class Header extends Component {

  render() {
    return (
      <Navbar collapseOnSelect >
        <Navbar.Header>
          <Navbar.Brand>
            Planning Poker
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Navbar.Text pullRight>
            <Nav>
              {this.props.playerName}
            </Nav>
          </Navbar.Text>
          <Navbar.Text pullRight>
            <Nav>
              {this.props.sessionId ? `Session ${this.props.sessionId}` : ''}
            </Nav>
          </Navbar.Text>
        </Navbar.Collapse>
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

export default connect(mapStateToProps)(Header);
