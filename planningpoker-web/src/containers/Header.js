import React, {Component} from 'react';
import {Navbar} from 'react-bootstrap';
import {connect} from 'react-redux';

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
              <a href='/' className='navbar-header-text'> Log Out </a>
            </Navbar.Text>
            <Navbar.Text pullRight className='navbar-header-text'>
              {`Session ${this.props.sessionId}`}
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

export default connect(mapStateToProps)(Header);
