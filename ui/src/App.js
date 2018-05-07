import React, { Component } from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom';

import Welcome from './pages/Welcome';
import Header from './containers/Header';

class App extends Component {
  render() {
    return (
      <div>
        <Header />
        <BrowserRouter>
          <div>
            <Switch>
              {/* put most specific routes at top (Switch tag facilitates this) */}
              <Route path="/" component={Welcome} />
            </Switch>
          </div>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;
