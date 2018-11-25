import React from 'react';
import { smoothlyMenu } from '../layouts/Helpers';
import * as firebase from 'firebase'
import { connect } from 'react-redux'
import ActionTypes from "@/store/Action"
import store from '@/store/store'

class TopHeader extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      uid: firebase.auth().currentUser.uid
    }
  }

  toggleNavigation(e) {
    e.preventDefault();
    $("body").toggleClass("mini-navbar");
    smoothlyMenu();
  }

  logout = () => {
    firebase.auth().signOut().then(() => {
      this.props.dispatch({ type: ActionTypes.LOGOUT })
    }).catch((error) => {
      console.log(error)
    });
  }


  render() {
    return (
      <div id="topHeader" className="row border-bottom">
        <nav className="navbar navbar-static-top white-bg" style={{ marginBottom: 0 }}>
          <div className="navbar-header">
            <a className="navbar-minimalize minimalize-styl-2 btn btn-primary " onClick={this.toggleNavigation}><i className="fa fa-bars"></i> </a>
          </div>
          {/* <ul className="nav navbar-top-links navbar-left">
            <li>
              <a data-toggle="dropdown" className="dropdown-toggle" href="#">
                <span className="clear">
                  <span className="text-muted text-xs block">Default<b className="caret"></b></span>
                </span>
              </a>
              <ul className="dropdown-menu animated zoomIn team-menu">
                <li><a href="#">See all teams</a></li>
                <li><a href="#">Add a team</a></li>
              </ul>
            </li>
          </ul> */}
          <ul className="nav navbar-top-links navbar-right" style={{ float: 'right' }}>
            <li style={{ marginRight: '20px' }}>
              <a onClick={this.logout}>
                <i className="fa fa-sign-out"></i>logout
              </a>
            </li>
          </ul>
        </nav>
      </div>
    )
  }
}

export default TopHeader
