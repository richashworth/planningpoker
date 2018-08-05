import React, {Component} from 'react';
import {Link} from 'react-router-dom';

import '../styles/Welcome.css';

class Welcome extends Component {

  _renderButton(label, link) {
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
      <div className="vertical-center">
        <div className="container text-center">
          {this._renderButton('Join Game', '/join')}
          {this._renderButton('Host New Game', '/host')}
        </div>
    </div>
    );
  }
}

export default Welcome;
