import React, { Component } from 'react'
import * as firebase from 'firebase'
import { Modal } from 'react-bootstrap'
import toastr from 'toastr/build/toastr.min.js'
import CollaboratorsSelect from './CollaboratorsSelect.jsx'
import { BoardRules, defaultAvtPath } from '@/const/AppConst.jsx'
import { connect } from 'react-redux'
import store, { Actions } from '@/store/store'


class ShareModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      collaboratorList: [],
      isOwner: false,
      isInvite: false,
      inputedUsers: [],
      roleSelected: BoardRules.view
    }
    this.inviteMembers = this.inviteMembers.bind(this)
    this.onShow = this.onShow.bind(this)
  }

  componentWillUnmount() {
    this.removeDbListener()
  }

  onShow() {
    this.removeDbListener()
    var board = this.props.board
    this.collaboratorSnap = {}
    this.setState({
      collaboratorList: [],
      inputedUsers: [],
      roleSelected: BoardRules.view,
      isInvite: false,
    })
    var uid = firebase.auth().currentUser.uid
    this.setState({ isOwner: (uid === board.owner && board.isDelete !== true) })
    var appDb = firebase.database().ref('whiteboard')
    this.membersDbRef = appDb.child('members/' + board.id)
    this.membersDbRef.on('child_added', (memberSnap) => {
      this.collaboratorSnap[memberSnap.key] = memberSnap.val()
      firebase.database().ref('users').orderByKey().equalTo(memberSnap.key).once('value', (userSnap) => {
        if (!this.collaboratorSnap[memberSnap.key]) return
        var userInfo = userSnap.val()[memberSnap.key]
        var memberInfo = {
          uid: memberSnap.key,
          role: memberSnap.val().role,
          email: userInfo.email,
          photoURL: userInfo.photoURL === 'default' ? defaultAvtPath : userInfo.photoURL,
          displayName: userInfo.displayName,
        }
        if (memberSnap.key === board.owner) {
          this.setState(prevState => ({
            collaboratorList: [memberInfo, ...prevState.collaboratorList]
          }))
        } else {
          this.setState(prevState => ({
            collaboratorList: [...prevState.collaboratorList, memberInfo]
          }))
        }
        if (memberSnap.key === uid) {
          this.setState({ isInvite: (memberSnap.val().role === 'invite' && board.isDelete !== true) })
        }
      })
    })
    this.membersDbRef.on('child_changed', (memberSnap) => {
      this.collaboratorSnap[memberSnap.key] = memberSnap.val()
      let collaboratorList = this.state.collaboratorList
      for (let i = 0; i < collaboratorList.length; i++) {
        const element = collaboratorList[i];
        if (element.uid === memberSnap.key) {
          element.role = memberSnap.val().role
          break
        }
      }
      let newState = {
        collaboratorList
      }
      if (memberSnap.key === uid) {
        newState.isOwner = memberSnap.val().role === BoardRules.owner
        newState.isInvite = memberSnap.val().role === BoardRules.invite
      }
      this.setState(newState)
    })
    this.membersDbRef.on('child_removed', (memberSnap) => {
      if (this.collaboratorSnap[memberSnap.key]) {
        const index = this.state.collaboratorList.findIndex(x => x.uid == memberSnap.key)
        if (index !== -1) {
          var array = [...this.state.collaboratorList]
          array.splice(index, 1)
          this.setState({
            collaboratorList: [...array]
          })
        }
        delete this.collaboratorSnap[memberSnap.key]
      }
    })
    this.boardListRef = appDb.child('participations/' + uid)
    this.boardListRef.on('child_removed', (boardid) => {
      if (boardid.key == this.props.board.id) {
        this.hide()
      }
    })
  }

  hide = () => {
    this.props.onHide()
    this.removeDbListener()
  }

  removeDbListener() {
    if (this.boardListRef) this.boardListRef.off()
    if (this.membersDbRef) this.membersDbRef.off()
    if (this.ivtsNonceNonceRef) this.ivtsNonceNonceRef.off()
  }

  inviteMembers() {
    var req = []
    let inputedUsers = this.state.inputedUsers.slice(0)
    inputedUsers.reduce((p, item, index) => {
      return p.then(result => {
        if (result.error) {
          return Promise.resolve(result)
        }
        return this.processEach(item, result.req);
      });
    }, Promise.resolve({ req })).then(result => {
      if (result.error) {
        console.log(result.error)
      }
    }).catch(() => {

    })
  }

  processEach(item, req) {
    const boardId = this.props.board.id
    const appDb = firebase.database().ref('whiteboard')
    let invitation = {
      email: item.email
    }, updates = {}
    if (item.uid) {
      invitation.isExistedAcc = true
      updates['members/' + boardId + '/' + item.uid] = { role: this.state.roleSelected }
      updates['invitations/' + item.uid + '/' + boardId] = true
    }
    return appDb.update(updates).then(error => {
      if (!error) req.push(invitation)
      return Promise.resolve({ error, req })
    })
  }

  setAuthorUser(uid, author) {
    var appDb = firebase.database().ref('whiteboard')
    var updates = {}
    updates['members/' + this.props.board.id + '/' + uid] = { role: author }

    if (author === BoardRules.owner) {
      const curUid = firebase.auth().currentUser.uid
      updates['board_infos/' + this.props.board.id + '/owner'] = uid
      updates['members/' + this.props.board.id + '/' + curUid + '/role'] = BoardRules.edit
      appDb.update(updates, (err) => {
        if (err) {
          toastr.options = {
            closeButton: true,
            progressBar: true,
            showMethod: 'slideDown',
            timeOut: 4000
          };
          toastr.error("Can't set owner for that user!");
        }
        this.showModal()
      })
    } else {
      if (author === BoardRules.view) {
        updates['boards/' + this.props.board.id + '/mouse_pos/' + uid] = null
      }
      appDb.update(updates, (err) => {
        if (err) {
          console.log(err)
        }
      })
    }
  }
  showModalchild(uid, displayName) {
    this.props.onHide()
    this.uid = uid
    this.refs.contentDelete.textContent = "Are you sure to delete " + displayName + " collaborator ?"
  }
  showModalSetOwner(uid, displayName) {
    this.props.onHide()
    this.uid = uid
    this.refs.contentSetOwner.textContent = "Are you sure give owner permissions to " + displayName + "?"
  }
  showModal() {
    this.props.reShow()
  }
  setDelete() {
    var appDb = firebase.database().ref('whiteboard')
    var updates = {}
    const boardId = this.props.board.id
    updates['members/' + boardId + '/' + this.uid] = null
    updates['participations/' + this.uid + '/' + boardId] = null
    updates['boards/' + boardId + '/mouse_pos/' + this.uid] = null
    appDb.update(updates, (err) => {
      if (err) {
        console.log(err)
      } else {
        toastr.options = {
          closeButton: true,
          progressBar: true,
          showMethod: 'slideDown',
          timeOut: 4000
        };
        toastr.success("Delete collaborator succesfully!");
      }
    })
    this.props.reShow()
  }

  onShowConfirmDeleteModal(ivtKey) {
    const obj = this.ivtsNonceSnap[ivtKey]
    if (!obj) return

    this.props.onHide()
    this.ivtKey = ivtKey
    this.refs.contentDelete.textContent = "Are you sure to delete " + obj.mail + " collaborator ?"
  }

  changeInvitationNonceRole(ivtKey, role) {
    const appDb = firebase.database().ref('whiteboard')
    let updates = {}
    updates['invitations_nonce/' + ivtKey + '/role'] = role
    appDb.update(updates, (err) => {
      if (err) {
        console.log(err)
      }
    })
  }

  deleteInvitationNonce(ivtKey) {
    const appDb = firebase.database().ref('whiteboard')
    const boardId = this.props.board.id
    let updates = {}
    updates['invitations_nonce/' + ivtKey] = null
    console.log(updates)
    appDb.update(updates, (err) => {
      if (err) {
        console.log(err)
      } else {
        toastr.options = {
          closeButton: true,
          progressBar: true,
          showMethod: 'slideDown',
          timeOut: 4000
        };
        toastr.success("Delete collaborator succesfully!");
      }
    })
    this.props.reShow()
  }


  renderInvitations() {
    const roleTexts = {
      view: "Can view",
      edit: "Can edit",
      invite: "Can invite",
    }
    const ivtsNonceSnap = { ...this.ivtsNonceSnap }
    const keys = Object.keys(ivtsNonceSnap)
    return keys.map((ivtKey, index) => {
      const item = ivtsNonceSnap[ivtKey]
      const roleRender = this.state.isOwner ? (
        <div className="ibox-tools">
          <a className="dropdown-toggle" data-toggle="dropdown" style={item.role == BoardRules.owner ? { cursor: 'default' } : {}}>
            {roleTexts[item.role]}
            {item.role != BoardRules.owner && <i className="fa fa-chevron-down"></i>}
          </a>
          {
            (item.role != BoardRules.owner) ?
              <ul className="dropdown-menu dropdown-user" style={{ left: '-70px' }}>
                {
                  Object.keys(roleTexts).map((roleKey, idx) =>
                    <li key={idx}><a href="javascript:void(0);" onClick={() => this.changeInvitationNonceRole(ivtKey, roleKey)}>{roleTexts[roleKey]}</a></li>
                  )
                }
                <li><a data-toggle="modal" data-target="#msgDelete" onClick={() => this.onShowConfirmDeleteModal(ivtKey)}>Delete</a></li>
              </ul> : ""
          }
        </div>
      ) : (
          <div className="ibox-tools">
            <a className="dropdown-toggle" data-toggle="dropdown" style={{ cursor: "default" }}>
              {roleTexts[item.role]}
            </a>
          </div>
        )
      return (
        <div key={index} className="row" style={{ display: 'flex', alignItems: 'center', paddingTop: '15px' }}>
          <div className="col-xs-2 col-sm-1">
            <a href="#"><img alt="image" className="img-circle" src={defaultAvtPath}
              style={{ width: '32px', height: '32px' }} /></a>
          </div>
          <div className="col-xs-7 col-sm-8" style={{ lineHeight: '14px' }}>
            <div style={{ color: '#1B2733' }}>{item.email}</div>
            <small>{item.email}</small>
          </div>
          <div className="col-xs-3" style={{ paddingLeft: '0px' }}>
            <div className="ibox-title" style={{ borderWidth: '0px', paddingLeft: '0px' }}>
              {roleRender}
            </div>
          </div>
        </div>
      )
    })
  }

  render() {
    const USER_AUTHOR_BOARD_TEXT = {
      view: "Can view",
      edit: "Can edit",
      invite: "Can invite",
      owner: "Owner"
    }
    const INVITE_ROLE = {
      view: "Can view",
      edit: "Can edit",
      invite: "Can invite",
    }
    const modalDelete = (
      <div>
        <div className="modal inmodal fade" id="msgDelete" tabIndex="-1" role="dialog" aria-hidden="true">
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header" style={{ padding: '8px' }}>
                <button type="button" className="close" data-dismiss="modal"><span aria-hidden="true">&times;</span>
                  <span className="sr-only">Close</span></button>
              </div>
              <div className="modal-body">
                <div ref="contentDelete" style={{ color: '#ed5565' }}></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-white" data-dismiss="modal"
                  onClick={() => this.showModal()}>No</button>
                <button type="button" className="btn btn-primary" data-dismiss="modal"
                  onClick={() => { this.uid && this.setDelete(); this.ivtKey && this.deleteInvitationNonce(this.ivtKey) }}>Yes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
    const modalSetOwner = (
      <div>
        <div className="modal inmodal fade" id="modalSetOwner" tabIndex="-1" role="dialog" aria-hidden="true">
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header" style={{ padding: '8px' }}>
                <button type="button" className="close" data-dismiss="modal"><span aria-hidden="true">&times;</span>
                  <span className="sr-only">Close</span></button>
              </div>
              <div className="modal-body">
                <div ref="contentSetOwner" style={{ color: '#ed5565' }}></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-white" data-dismiss="modal"
                  onClick={() => this.showModal()}>No</button>
                <button type="button" className="btn btn-primary" data-dismiss="modal"
                  onClick={() => this.setAuthorUser(this.uid, BoardRules.owner)}>Yes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
    const MembersView = this.state.isOwner
      ? (this.state.collaboratorList.map((item, index) => (
        <div key={index} className="row" style={{ display: 'flex', alignItems: 'center', paddingTop: '15px' }}>
          <div className="col-xs-2 col-sm-1">
            <a href="#"><img alt="image" className="img-circle" src={item.photoURL}
              style={{ width: '32px', height: '32px' }} /></a>
          </div>
          <div className="col-xs-7 col-sm-8" style={{ lineHeight: '14px' }}>
            <div style={{ color: '#1B2733' }}>{item.displayName}</div>
            <small>{item.email}</small>
          </div>
          <div className="col-xs-3" style={{ paddingLeft: '0px' }}>
            <div className="ibox-title" style={{ borderWidth: '0px', paddingLeft: '0px' }}>
              <div className="ibox-tools">
                <a className="dropdown-toggle" data-toggle="dropdown" style={item.role == BoardRules.owner ? { cursor: 'default' } : {}}>
                  {USER_AUTHOR_BOARD_TEXT[item.role]}
                  {item.role != BoardRules.owner && <i className="fa fa-chevron-down"></i>}
                </a>
                {
                  (item.role != BoardRules.owner) ?
                    <ul className="dropdown-menu dropdown-user" style={{ left: '-70px' }}>
                      {
                        Object.keys(USER_AUTHOR_BOARD_TEXT).map((key, idx) =>
                          (key == BoardRules.owner) ?
                            <li key={idx}><a href="javascript:void(0);" data-toggle="modal" data-target="#modalSetOwner"
                              onClick={() => this.showModalSetOwner(item.uid, item.displayName)}>
                              {USER_AUTHOR_BOARD_TEXT[key]}</a></li>
                            : <li key={idx}><a href="javascript:void(0);" onClick={() => this.setAuthorUser(item.uid, key)}>
                              {USER_AUTHOR_BOARD_TEXT[key]}</a></li>
                        )
                      }
                      <li><a data-toggle="modal" data-target="#msgDelete" onClick={() => { this.showModalchild(item.uid, item.displayName) }}>Delete</a></li>
                    </ul> : ""
                }
              </div>
            </div>
          </div>
        </div>
      )))
      : (this.state.collaboratorList.map((item, index) => (
        <div key={index} className="row" style={{ display: 'flex', alignItems: 'center', paddingTop: '15px' }}>
          <div className="col-xs-2 col-sm-1">
            <a href="#"><img alt="image" className="img-circle" src={item.photoURL}
              style={{ width: '32px', height: '32px' }} /></a>
          </div>
          <div className="col-xs-7 col-sm-8" style={{ lineHeight: '14px' }}>
            <div style={{ color: '#1B2733' }}>{item.displayName}</div>
            <small>{item.email}</small>
          </div>
          <div className="col-xs-3" style={{ paddingLeft: '0px' }}>
            <div className="ibox-title" style={{ borderWidth: '0px', paddingLeft: '0px' }}>
              <div className="ibox-tools">
                <a className="dropdown-toggle" data-toggle="dropdown" style={{ cursor: "default" }}>
                  {USER_AUTHOR_BOARD_TEXT[item.role]}
                </a>
              </div>
            </div>
          </div>
        </div>
      )))
    return (
      <div >
        <Modal show={this.props.show} onShow={this.onShow} onHide={this.hide}>
          <Modal.Header closeButton>
            <Modal.Title>{this.props.board.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row" id="sharedBoardAddModal" style={!this.state.isOwner && !this.state.isInvite ? { display: 'none' } : {}}>
              <div className="form-horizontal">
                <div className="form-group">
                  <div className="col-xs-2 col-sm-1" style={{ paddingLeft: '0px' }}>
                    <label className="control-label">To</label>
                  </div>
                  <div className="col-xs-10 col-sm-8 no-padding">
                    <CollaboratorsSelect value={this.state.inputedUsers} except={this.state.collaboratorList} onChange={value => this.setState({ inputedUsers: value })} disabled={!(this.state.isOwner || this.state.isInvite)} />
                  </div>
                  <div className="col-xs-12 col-sm-3 no-padding">
                    <div className="ibox-title" style={{ borderWidth: '0px', minHeight: '36px', paddingTop: '9px', textAlign: 'right', paddingRight: '0px' }}>
                      <div className="ibox-tools">
                        <a className="dropdown-toggle" data-toggle="dropdown" href="#" style={{ color: '#676a6c' }}>
                          {INVITE_ROLE[this.state.roleSelected]} <i className="fa fa-chevron-down"></i>
                        </a>
                        <ul className="dropdown-menu dropdown-user" style={{ left: '-43px', display: this.state.isOwner ? '' : 'none' }}>
                          {
                            Object.keys(INVITE_ROLE).map((item, i) =>
                              <li key={i}>
                                <a href="javascript:void(0);" onClick={() => this.setState({ roleSelected: item })}>
                                  {INVITE_ROLE[item]}
                                </a>
                              </li>
                            )
                          }
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div id="sharedBoardMVModal">
              {MembersView}
              {this.renderInvitations()}
            </div>
          </Modal.Body>
          <Modal.Footer style={!this.state.isOwner && !this.state.isInvite ? { display: 'none' } : {}}>
            <button className="btn btn-success" disabled={!(this.state.isOwner || this.state.isInvite)
              || this.state.inputedUsers.length == 0} onClick={this.inviteMembers}>Share</button>
          </Modal.Footer>
        </Modal>
        {modalDelete}
        {modalSetOwner}
      </div>
    )
  }
}



export default ShareModal
