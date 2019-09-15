import React, {Component} from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import {Provider} from 'react-redux';
import {applyMiddleware, compose, createStore} from 'redux';
import ReduxPromise from 'redux-promise';
import reducer from './reducers';

import Header from './containers/Header';
import Welcome from './pages/Welcome';
import JoinGame from './pages/JoinGame';
import CreateGame from './pages/CreateGame';
import PlayGame from './pages/PlayGame';
import Footer from './components/Footer';

const middleware = [ReduxPromise];

// eslint-disable-next-line no-underscore-dangle
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducer,
  composeEnhancers(applyMiddleware(...middleware)),
);

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <div>
            <Header/>
            <main>
              <div>
                <Switch>
                  <Route path="/host" component={CreateGame}/>
                  <Route path="/join" component={JoinGame}/>
                  <Route path="/game" component={PlayGame}/>
                  <Route path="/" component={Welcome}/>
                </Switch>
              </div>
            </main>
            <Footer/>
          </div>
        </BrowserRouter>
      </Provider>
    );
  }
}

export default App;
