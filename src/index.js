import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import * as firebase from "firebase";
import { BrowserRouter, Route } from 'react-router-dom';
import smoothscroll from 'smoothscroll-polyfill';

import 'jquery';
import 'bootstrap';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import 'animate.css/animate.min.css';
import toastr from 'toastr/build/toastr.min.js';
import 'toastr/build/toastr.min.css';
import './vendor/inspinia/css/style.css';

// Please add new import above
import './utils/utils'
import App from './App.jsx';

firebase.initializeApp(JSON.parse(process.env.FIREBASE_CONFIG));

smoothscroll.polyfill();

toastr.options = {
  timeOut: 2000
}


ReactDOM.render(
    <BrowserRouter>
      <Route path="/" component={App} />
    </BrowserRouter>,
  document.getElementById('root')
);
registerServiceWorker();
