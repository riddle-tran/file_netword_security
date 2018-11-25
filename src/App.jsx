import React, { Component } from 'react'
import AppRouter from '@/router/Router.jsx'
import * as firebase from 'firebase'
import { Provider } from 'react-redux'
import store from '@/store/store'
import ActionTypes from "@/store/Action"
import './stylesheets/app.css'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true
    }
  }

  componentDidMount() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        store.dispatch({ type: ActionTypes.LOGIN })
      } else {
        store.dispatch({ type: ActionTypes.LOGOUT })
      }
      this.setState({ loading: false })
    });
  }

  componentWillUnmount() {
  }

  render() {
    if (this.state.loading) {
      return (
        <div></div>
      )
    } else {
      return (
        <Provider store={store}>
          <div className="App" style={{ height: '100%' }}>
            {AppRouter}
          </div>
        </Provider>
      )
    }
  }
}

export default App
