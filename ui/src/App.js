import React, {Component} from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import {Provider} from 'react-redux';
import {applyMiddleware, createStore} from 'redux';
import ReduxPromise from 'redux-promise';
import reducers from './reducers';

import Header from './containers/Header';
import Welcome from './pages/Welcome';
import JoinGame from './pages/JoinGame';
import CreateGame from './pages/CreateGame';
import PlayGame from './pages/PlayGame';
import Footer from './components/Footer';

const createStoreWithMiddleware = applyMiddleware(ReduxPromise)(createStore);

class App extends Component {
  render() {
    return (
      <Provider store={createStoreWithMiddleware(reducers)}>
        <div>
          <Header/>
          <main>
            <BrowserRouter>
              <div>
                <Switch>
                  <Route path="/host" component={CreateGame}/>
                  <Route path="/join" component={JoinGame}/>
                  <Route path="/game" component={PlayGame}/>
                  <Route path="/" component={Welcome}/>
                </Switch>
              </div>
            </BrowserRouter>
          </main>
          <Footer/>
        </div>
      </Provider>
    );
  }
}

export default App;
