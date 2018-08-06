import React, {Component} from 'react';
import {Nav, Navbar, NavItem} from 'react-bootstrap';
import axios from 'axios';
import {ROOT_URL} from '../config/Constants';

import '../styles/Footer.css';

export default class Footer extends Component {

  constructor(props) {
    super(props);

    this.state = {appVersion: ''};
  }

  componentDidMount() {
    const request = axios.get(`${ROOT_URL}/version`);
    request.then(x => this.setState({appVersion: x.data}));
  }


  render() {
    return (
      <Navbar collapseOnSelect className="navbar-fixed-bottom">
        <Nav>
          <Navbar.Text>
            version {this.state.appVersion}
          </Navbar.Text>
        </Nav>
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
