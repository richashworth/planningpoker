import React, {Component} from 'react';
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import {connect} from 'react-redux';

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
          <Nav pullRight>
            <NavItem>
              Session: {this.props.sessionId}
            </NavItem>
            <NavItem>
              User: {this.props.playerName}
            </NavItem>
          </Nav>
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
