import React, { Component } from 'react'
import * as firebase from 'firebase'
import { connect } from 'react-redux'
import ActionTypes from '@/store/Action'
import qs from 'query-string'
import '@/stylesheets/components/Login.css'
import 'bootstrap-social/bootstrap-social.css'

class Login extends Component {
  constructor(props) {
    super(props)
    this.state = {
      display: true
    }
  }

  componentDidMount() {
    if (this.props.isLogged) {
      this.handleLogged(firebase.auth().currentUser)
      return
    }
    var fragment = this.getFragment();
    if (fragment != null && Object.keys(fragment).length > 0) {
      $('.ibox-content').toggleClass('sk-loading')
      this.setState({ display: false })
    }
    var paramObj = qs.parse(this.props.location.search)
    if (paramObj != null && Object.keys(paramObj).length > 0) {
      $('.ibox-content').toggleClass('sk-loading')
      this.setState({ display: false })
      window.opener.firebaseObj = paramObj
      window.close()
    }
  }
  handleLogged(user) {
    var token = this.props.location.state.from
    if (token) {
      this.props.history.push(this.props.location.state.from.pathname)
    } else {
      this.props.history.push("/app/boards")
    }
  }
  loginWithGoogle() {
    var $iboxContent = $('.ibox-content')
    $iboxContent.toggleClass('sk-loading')
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
      if (result.additionalUserInfo.isNewUser) {
        this.createNewUser(result.user)
      }
      $('.ibox-content').toggleClass('sk-loading')
      this.props.dispatch({ type: ActionTypes.LOGIN })
      this.handleLogged(result.user)
    }).catch((error) => {
      $iboxContent.toggleClass('sk-loading')
      if (error.code !== "auth/popup-closed-by-user") {
        $("#btnLoginFail").click()
      }
    });
  }
  createNewUser(user) {
    var updates = {}
    updates['users/' + user.uid + '/email'] = user.email
    updates['users/' + user.uid + '/displayName'] = user.displayName
    updates['users/' + user.uid + '/phoneNumber'] = user.phoneNumber
    updates['users/' + user.uid + '/photoURL'] = user.photoURL || 'default'
    if (user.email !== null) {
      updates['emails/' + user.email.replace(/\./g, "%2E")] = user.uid
    }
    firebase.database().ref().update(updates, (error) => {
      //
    })
  }
  parseQueryString(queryString) {
    var data = {}, pairs, pair, separatorIndex, escapedKey, escapedValue, key, value;
    if (queryString === null) {
      return data;
    }
    pairs = queryString.split("&");
    for (var i = 0; i < pairs.length; i++) {
      pair = pairs[i];
      separatorIndex = pair.indexOf("=");
      if (separatorIndex === -1) {
        escapedKey = pair;
        escapedValue = null;
      } else {
        escapedKey = pair.substr(0, separatorIndex);
        escapedValue = pair.substr(separatorIndex + 1);
      }
      key = decodeURIComponent(escapedKey);
      value = decodeURIComponent(escapedValue);
      data[key] = value;
    }
    return data;
  }
  getFragment() {
    if (window.location.hash.indexOf("#") === 0) {
      return this.parseQueryString(window.location.hash.substr(1));
    } else {
      return {};
    }
  }

  render() {
    return (
      <div className="row" id="authorize_form">
        <div className="ibox-content" style={{ height: '100%' }}>
          <div className="sk-spinner sk-spinner-double-bounce">
            <div className="sk-double-bounce1"></div>
            <div className="sk-double-bounce2"></div>
          </div>
          <div className="login-content text-center loginscreen animated fadeInDown">
            <div style={this.state.display ? {} : { display: 'none' }}>
              <a className="btn btn-gg-login" onClick={() => this.loginWithGoogle()}>
                <div className="img-login"><img src="/img/login-icon/google-icon.png" /></div>
                <div className="txt-login">Gmail Login</div>
              </a>
            </div>
            <button type="button" id="btnLoginFail" data-toggle="modal" data-target="#modalLoginFail" style={{ display: 'none' }}>
            </button>
            <div className="modal inmodal fade" id="modalLoginFail" tabIndex="-1" role="dialog" aria-hidden="true">
              <div className="modal-dialog modal-sm">
                <div className="modal-content">
                  <div className="modal-header" style={{ padding: '8px' }}>
                    <button type="button" className="close" data-dismiss="modal"><span aria-hidden="true">&times;</span>
                      <span className="sr-only">Close</span></button>
                  </div>
                  <div className="modal-body">
                    Login failed please try again
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="login-footer row">
            <div className='footer-inline'>
              <a href="#" target="post">
                <span>N14DCAT011</span>
              </a>
              <a href="#" target="post">
                <span>TRAN VAN NAM</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return { isLogged: state.isLogged }
}

export default connect(mapStateToProps)(Login)
