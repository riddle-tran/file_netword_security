import React, { Component } from 'react'
import * as firebase from 'firebase'
import { defaultAvtPath } from '@/const/AppConst.jsx'

class CollaboratorsContent extends Component {
  constructor(props) {
    super(props)
    this.membersDbRef = firebase.database().ref('whiteboard/members/' + props.boardId)
    this.state = {
      collaboratorList: []
    }
  }

  componentDidMount() {
    this.membersDbRef.on('child_added', (data) => {
      var memberInfo = {
        uid: data.key,
        email: "",
        photoURL: "",
      }
      var i = this.state.collaboratorList.length
      this.setState(prevState => ({
        collaboratorList: [...prevState.collaboratorList, memberInfo]
      }), () => {
        firebase.database().ref('users').orderByKey().equalTo(memberInfo.uid).once('value', (userSnap) => {
          var userInfo = userSnap.val()[memberInfo.uid]
          var temp = this.state.collaboratorList
          temp[i].displayName = userInfo.displayName
          temp[i].photoURL = userInfo.photoURL === 'default' ? defaultAvtPath : userInfo.photoURL
          this.setState({ collaboratorList: temp })
        })
      })
    })
    this.membersDbRef.on('child_removed', (data) => {
      let uid = data.key;
      let temp = [];
      this.state.collaboratorList.map((item, index) => {
   //     item.uid != uid ? temp.push(item) : null
      })
      this.setState({ collaboratorList: temp })
    })
  }

  componentWillUnmount() {
    this.membersDbRef.off()
  }

  render() {
    const CollaboratorListView = this.state.collaboratorList.map((item, index) => {
      return (
        <img src={item.photoURL} key={index} alt={item.displayName} title={item.displayName} style={{ border: "solid 1px #bdc7d8", margin: "10px 0 10px 10px" }}></img>
      )
    })
    return (
      <div id="photos">
        {CollaboratorListView}
      </div>
    )
  }
}

export default CollaboratorsContent
