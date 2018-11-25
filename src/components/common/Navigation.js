import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import * as firebase from 'firebase'
import { defaultAvtPath } from '@/const/AppConst.jsx'
import store, { Actions } from '@/store/store'
import { connect } from 'react-redux'

class Navigation extends Component {
  constructor(props) {
    super(props)
    this.state = {
      user: {},
      windowHeight: window.innerHeight,
    }
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this)
    this.showPricing = this.showPricing.bind(this)
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateWindowDimensions)
    const { menu } = this.refs;
    $(menu).metisMenu();
    var uid = firebase.auth().currentUser.uid
    var usersRef = firebase.database().ref('users')
    this.userInfoDb = usersRef.orderByKey().equalTo(uid)
    this.userInfoDb.on('value', (userSnap) => {
      var user = userSnap.val()[uid]
      user.photoURL = user.photoURL === 'default' ? defaultAvtPath : user.photoURL
      this.setState({ user: user })
    })
  }

  componentWillMount() {
    window.removeEventListener('resize', this.updateWindowDimensions)
    if (this.userInfoDb) this.userInfoDb.off()
    if (this.permissionDb) this.permissionDb.off()
  }

  updateWindowDimensions() {
    this.setState({ windowHeight: window.innerWidth });
  }

  showPricing() {
    store.dispatch({ type: Actions.SHOW_PRICING })
  }

  activeRoute(routeName) {
    return this.props.location.pathname.indexOf(routeName) > -1 ? "active" : "";
  }

  secondLevelActive(routeName) {
    return this.props.location.pathname.indexOf(routeName) > -1 ? "nav nav-second-level collapse in" : "nav nav-second-level collapse";
  }

  render() {
    return (
      <nav className="navbar-default navbar-static-side">
        <ul className="nav metismenu" id="side-menu" ref="menu">
          <li className="nav-header">
            <div className="dropdown profile-element">
              <span><img alt="user" className="img-circle" src={this.state.user.photoURL} width={48} height={48} /></span>
              <a data-toggle="dropdown" className="dropdown-toggle" href="#">
                <span className="clear">
                  <span className="block m-t-xs">
                    <strong className="font-bold">{this.state.user.displayName}</strong>
                  </span>
                  {/* <span className="text-muted text-xs block">User<b className="caret"></b></span>*/}
                </span>
              </a>
              {/*<ul className="dropdown-menu animated fadeInRight m-t-xs">
                <li><a href="#"> Logout</a></li>
              </ul>*/}
            </div>
            <div className="logo-element"><img alt="image" src="/favicon.png" width={48} /></div>
          </li>
          <ul className="nav metismenu menu-content" style={{ height: this.state.windowHeight - 200, maxHeight: this.state.windowHeight - 200 }}>
            <li className={this.activeRoute("/app/boards")}>
              <Link to="/app/boards"><i className="fa fa-th-large"></i> <span className="nav-label">My Boards</span></Link>
            </li>
            <li className={this.activeRoute("/app/share")}>
              <Link to="/app/share"><i className="fa fa-share-alt-square"></i> <span className="nav-label">Shared with me</span></Link>
            </li>
            <li className={this.activeRoute("/app/deleted-boards")}>
              <Link to="/app/deleted-boards"><i className="fa fa-trash-o"></i> <span className="nav-label">Deleted Boards</span></Link>
            </li>
          </ul>
        </ul>
      </nav>
    )
  }
}



export default Navigation
