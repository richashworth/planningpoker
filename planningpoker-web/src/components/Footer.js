import React, {Component} from 'react';
import {Nav, Navbar, NavItem} from 'react-bootstrap';
import axios from 'axios';
import {API_ROOT_URL} from '../config/Constants';

import '../styles/Footer.css';

export default class Footer extends Component {

  constructor(props) {
    super(props);

    this.state = {appVersion: ''};
  }

  componentDidMount() {
    const request = axios.get(`${API_ROOT_URL}/version`);
    request.then(x => this.setState({appVersion: x.data}));
  }

  _renderVersionNav(version) {
    return (
      <Nav className='hidden-xs'>
        <Navbar.Text>
          {version ? `version ${version}` : ''}
        </Navbar.Text>
      </Nav>
    );
  }

  render() {
    return (
      <Navbar collapseOnSelect className="navbar-fixed-bottom">
        {this._renderVersionNav(this.state.appVersion)}
        <Nav pullRight className='navbar-footer-text'>
          <NavItem
            href="https://richashworth.github.io/planningpoker/" target="_blank">
            About
          </NavItem>
        </Nav>
      </Navbar>
    );
  }

}
