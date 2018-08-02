import React, {Component} from 'react';
import {Link} from 'react-router-dom';

import '../styles/Welcome.css';

class Welcome extends Component {

  createButton(label, link) {
    return (
      <div className="btn-row">
        <Link to={link}>
          <button type="button" className="btn btn-primary btn-lg">
            {label}
          </button>
        </Link>
      </div>
    );
  }

  render() {
    return (
      <div className="container align-self-center">
        {this.createButton('Join Game', '/join')}
        {this.createButton('Create Game', '/create')}
      </div>
    );
  }
}

export default Welcome;
