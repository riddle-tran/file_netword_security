import React, { Component } from 'react'
import * as firebase from 'firebase'
import moment from 'moment'
import { connect } from 'react-redux'
import store, { Actions } from '@/store/store'
import toastr from 'toastr/build/toastr.min.js'

import LoadingSpinner from '@/components/common/LoadingSpinner'
import ShareModal from './ShareModal.jsx'

import '@/stylesheets/components/BoardList.css'

const boardNameRegex = /[^a-zA-Z0-9\s_\[\]\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g
const previewSmallSize = 24

class AuthrorizedContent extends Component {

  constructor(props) {
    super(props)
    this.tableBoardsRef = React.createRef()
    this.createBoard = this.createBoard.bind(this)
    this.state = {
      boardList: [],
      boardName: "",
      uid: firebase.auth().currentUser.uid,
      view: false,
      shareModalShow: false,
      boardSelected: {},
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    }
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this)
    this.showCreateModal = this.showCreateModal.bind(this)

  }

  componentDidMount() {
    this._mounted = true
    window.addEventListener('resize', this.updateWindowDimensions)
    this.boardInfos = []
    this.listenBoardList()
  }
  componentWillUnmount() {
    clearTimeout(this.previewDelay)
    this._mounted = false
    window.removeEventListener('resize', this.updateWindowDimensions)
    this.boardListRef.off()
    this.boardInfos.forEach((boardInfo) => {
      boardInfo.off()
    })
  }

  updateWindowDimensions() {
    this.setState({ windowWidth: window.innerWidth, windowHeight: window.innerHeight })
  }

  listenBoardList() {
    this.boardListRef = firebase.database().ref('whiteboard/participations/' + this.state.uid)
    this.boardListRef.on('value', (snapshot) => {
      if (this.boardInfos.length !== 0) {
        this.boardInfos.forEach((boardInfo) => {
          boardInfo.off()
        })
        this.boardInfos = []
      }
      if (this._mounted) this.setState({ boardList: [] }, () => {
        var i = 0;
        snapshot.forEach((childSnapshot) => {
          let pos = Object.keys(snapshot.val()).length - ++i
          this.boardInfos.push(firebase.database().ref('whiteboard/board_infos/' + childSnapshot.key))
          this.boardInfos[this.boardInfos.length - 1].on('value', (boardInfo) => {
            if (boardInfo.val()) {
              let board = boardInfo.val()
              const owner = board.owner
              board.id = childSnapshot.key
              let boardList = this.state.boardList.slice(0)
              boardList[pos] = board
              let boardSelected = this.state.boardSelected
              if (boardSelected && boardSelected.owner !== owner) {
                boardSelected = board
              }
              if (this._mounted) this.setState({ boardList, boardSelected }, () => {
                if (board.isDelete !== true) {
                  firebase.database().ref('users').orderByKey().equalTo(owner).once('value', (userSnap) => {
                    var userInfo = userSnap.val()[owner]
                    let boardList = this.state.boardList.slice(0)
                    if (boardList[pos].owner === owner) {
                      boardList[pos]._ownerName = userInfo.displayName
                      if (this._mounted) this.setState({ boardList })
                    }
                  })
                }
              })
            }
          })
        });
      })
    });
  }

  handleSelect(boardId) {
    this.props.history.push('/app/edit-board/' + boardId)
  }

  handleKeyPressRenameInput = (e) => {
    if (e.key === 'Enter') {
      if (this.state.boardRename.match(boardNameRegex)) {
        toastr.options = {
          closeButton: true,
          progressBar: true,
          showMethod: 'slideDown',
          timeOut: 4000
        };
        toastr.error("Board name can't have special character!");
        return
      }
      this.renameBoard()
      this.setState({ boardIdRename: "" })
    }
  }

  handleKeyPressCreateInput = (e) => {
    if (e.key === 'Enter') {
      if (this.state.boardName.match(boardNameRegex)) {
        toastr.options = {
          closeButton: true,
          progressBar: true,
          showMethod: 'slideDown',
          timeOut: 4000
        };
        toastr.error("Board name can't have special character!");
        return
      }
      this.createBoard()
      this.setState({ boardName: "" })
      $("#addModal").modal('hide')
    }
  }

  showCreateModal() {
    $("#addModal").modal('show')
  }

  setBoardRename(boardId, boardrename) {
    this.setState({
      boardIdRename: boardId,
      boardRename: boardrename
    }, () => {
      this.nameInput.focus();
    })
  }
  renameBoard() {
    var updates = {}
    updates['name'] = this.state.boardRename
    firebase.database().ref('whiteboard/board_infos/' + this.state.boardIdRename).update(updates, (error) => {
      if (error) {
        console.log(error.message)
      }
      else console.log("rename board succesfully")
    })
  }

  createBoard() {
    var user = firebase.auth().currentUser
    if (!user || !this.state.boardName) return
    var req = {
      name: this.state.boardName,
      owner: user.uid,
      creator: user.uid,
      createdTime: firebase.database.ServerValue.TIMESTAMP
    }
    var appDb = firebase.database().ref('whiteboard')
    var newBoardId = appDb.child('board_infos').push().key
    var updates = {}
    updates['board_infos/' + newBoardId] = req
    updates['members/' + newBoardId + '/' + user.uid] = { role: 'owner' }
    updates['participations/' + user.uid + '/' + newBoardId] = true
    appDb.update(updates, (error) => {
      if (error) {
        console.log(error.message)
      } else {
        toastr.success("create board successfully")
      }
    })
  }

  showModalShare(index) {
    this.setState({
      shareModalShow: true,
      boardSelected: this.state.boardList[index]
    })
  }

  setBoardDeleteContent(boardId, boardName) {
    this.setState({
      boardIdDelete: boardId
    })
    $('#deleteBoardContent').text("are you sure to delete " + boardName + " board?")
  }

  deleteBoard() {
    var boardId = this.state.boardIdDelete
    var db = firebase.database().ref('whiteboard')
    db.child('members/' + boardId).once('value', (boards) => {
      var updates = {}
      updates['board_infos/' + boardId + '/isDelete'] = true
      updates['board_infos/' + boardId + '/deleteTime'] = firebase.database.ServerValue.TIMESTAMP
      db.update(updates, (error) => {
        //
      })
    })
  }

  setLeaveBoardContent(boardId, boardName) {
    this.setState({
      boardIdLeave: boardId
    })
    $('#leaveBoardContent').text("are you sure to leave " + boardName + " board?")
  }

  leaveBoard() {
    let db = firebase.database().ref('whiteboard')
    let boardId = this.state.boardIdLeave
      let uid = firebase.auth().currentUser.uid
      let updates = {}
      updates['members/' + boardId + '/' + uid] = null
      updates['participations/' + uid + '/' + boardId] = null
      db.update(updates, (error) => {
        if (error === null) {
          toastr.success("leave board successfully")
        } else {
          toastr.error("leave board failed");
        }
      })
  }


  onPreviewLargeLoad(e, index) {
    e.target.style.display = 'block'
    document.getElementById('preview-large-spinner-' + index).style.display = 'none'
  }

  render() {
    const BoardListView = this.state.boardList.map((item, index) => {
      return (
        item.isDelete !== true ?
          <tr key={index}>
            <td onClick={() => { this.handleSelect(item.id) }} style={{ cursor: 'pointer', verticalAlign: 'middle', width: previewSmallSize + 'px' }}>
              <div className="preview-small" style={{ width: previewSmallSize + 'px', height: previewSmallSize + 'px' }}
                onClick={(e) => { e.stopPropagation() }}>
                {index === this.state.previewSelected &&
                  <div id={'preview-large-' + item.id} className="preview-large" onClick={(e) => { e.stopPropagation() }}>
                    {item.previewFullURL && <img src={item.previewFullURL} width="200px" height="200px" onLoad={(e) => { this.onPreviewLargeLoad(e, index) }} style={{ display: 'none' }} />}
                    <LoadingSpinner id={'preview-large-spinner-' + index} type={LoadingSpinner.LoadingTypes.FADING_CIRCLE} iconWidth="48px" iconHeight="48px" style={{ width: "200px", height: "200px" }} />
                  </div>}
                {item.previewURL && <img src={item.previewURL} width={previewSmallSize + 'px'} height={previewSmallSize + 'px'} />}
              </div>
            </td>
            {this.state.boardIdRename == item.id ? (
              <td>
                <input type="text" className="form-control" id="boardReName"
                  value={this.state.boardRename}
                  onKeyPress={this.handleKeyPressRenameInput}
                  onFocus={(e) => { e.target.select() }}
                  onBlur={(e) => this.setState({ boardIdRename: "" })}
                  ref={(input) => { this.nameInput = input }}
                  onChange={(e) => this.setState({ boardRename: e.target.value })}>
                </input>
              </td>
            ) : (
                <td onClick={() => { this.handleSelect(item.id) }} style={{ cursor: 'pointer', verticalAlign: 'middle', maxWidth: (window.innerWidth - 90) + 'px', overflow: 'hidden' }}>
                  {item.name}
                </td>
              )}

            <td onClick={() => { this.handleSelect(item.id) }} style={{ cursor: 'pointer', verticalAlign: 'middle' }}>{item._ownerName}</td>
            <td onClick={() => { this.handleSelect(item.id) }} style={{ cursor: 'pointer', verticalAlign: 'middle' }}>{moment(item.createdTime).format('LLL')}</td>
            <td style={{ verticalAlign: 'middle' }}>
              <div className="note-btn-group btn-group">
                <div className="note-btn-group btn-group note-para dropdown-toggle" data-toggle="dropdown">
                  <button type="button" className="note-btn btn btn-default btn-sm">...</button>
                </div>
                <div className="dropdown-menu dropdown-user" style={{ left: '-128px', marginTop: '5px' }}>
                  <li onClick={() => this.showModalShare(index)}><a href="javascript:void(0);">
                    Share
                  </a></li>
                  <li data-toggle="modal"><a href="javascript:void(0);"
                    onClick={() => this.setBoardRename(item.id, item.name)}
                    style={this.state.uid !== item.owner ? { display: 'none' } : {}}>
                    Rename
                  </a></li>
                  <li data-toggle="modal"
                    data-target="#modalLoginFail"><a href="javascript:void(0);"
                      onClick={() => this.setBoardDeleteContent(item.id, item.name)}
                      style={this.state.uid !== item.owner ? { display: 'none' } : {}}>
                      Delete
                    </a></li>
                  <li data-toggle="modal"
                    data-target="#leaveBoard"><a href="javascript:void(0);"
                      onClick={() => this.setLeaveBoardContent(item.id, item.name)}
                      style={this.state.uid === item.owner ? { display: 'none' } : {}}>
                      Leave
                    </a></li>
                </div>
              </div>
            </td>
          </tr>
          :
          <tr key={index} style={{ display: 'none' }}></tr>
      )
    })
    if (this._mounted) {
      var minHeight = this.state.windowHeight - document.getElementById('topHeader').offsetHeight - document.getElementsByClassName('footer')[0].offsetHeight
    }
    return (
      <div id="authrorized_content" style={{ minHeight }}>
        <div className="row" id="list_panel">
          <div className="col-lg-12">
            <div className="wrapper wrapper-content">
              <div className="row">
                <div className="ibox float-e-margins">
                  <div className="ibox-title">
                    <h5>My Boards</h5>
                  </div>
                  <div className="ibox-content">
                    <table ref={this.tableBoardsRef} className="table table-hover">
                      <thead>
                        <tr>
                          <th colSpan="2">Name</th>
                          <th style={{ width: '140px', textAlign: 'left' }}>Owner Name</th>
                          <th style={{ width: '150px', textAlign: 'left' }}>Created Time</th>
                          <th style={{ width: '50px', textAlign: 'left', paddingTop: "0px" }}>
                            <button type="button" className="btn btn-primary" style={{ paddingLeft: '10px', paddingRight: '10px' }} onClick={this.showCreateModal}>
                              <i className="fa fa-plus" id="create-button-icon" ></i>
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody id="list" style={{ maxHeight: '400px' }}>
                        {BoardListView}
                      </tbody>
                    </table>
                    <div className="modal inmodal fade" id="modalLoginFail" tabIndex="-1" role="dialog" aria-hidden="true">
                      <div className="modal-dialog modal-sm">
                        <div className="modal-content">
                          <div className="modal-header" style={{ padding: '8px' }}>
                            <button type="button" className="close" data-dismiss="modal"><span aria-hidden="true">&times;</span>
                              <span className="sr-only">Close</span></button>
                          </div>
                          <div className="modal-body">
                            <div id="deleteBoardContent" style={{ wordWrap: 'break-word' }}></div>
                          </div>
                          <div className="modal-footer">
                            <button type="button" className="btn btn-white" data-dismiss="modal">No</button>
                            <button type="button" className="btn btn-primary" data-dismiss="modal"
                              onClick={() => this.deleteBoard()}>Yes</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal inmodal fade" id="leaveBoard" tabIndex="-1" role="dialog" aria-hidden="true">
                      <div className="modal-dialog modal-sm">
                        <div className="modal-content">
                          <div className="modal-header" style={{ padding: '8px' }}>
                            <button type="button" className="close" data-dismiss="modal"><span aria-hidden="true">&times;</span>
                              <span className="sr-only">Close</span></button>
                          </div>
                          <div className="modal-body">
                            <div id="leaveBoardContent" style={{ wordWrap: 'break-word' }}></div>
                          </div>
                          <div className="modal-footer">
                            <button type="button" className="btn btn-white" data-dismiss="modal">No</button>
                            <button type="button" className="btn btn-primary" data-dismiss="modal"
                              onClick={() => this.leaveBoard()}>Yes</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div id="addModal" className="modal inmodal fade" tabIndex="-1" role="dialog" aria-hidden="true">
                      <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                          <div className="modal-body">
                            <input type="text" className="form-control" id="create-panel-filename" placeholder={"Enter file name"}
                              value={this.state.boardName}
                              onKeyPress={this.handleKeyPressCreateInput}
                              onChange={(e) => this.setState({ boardName: e.target.value })}>
                            </input>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ShareModal show={this.state.shareModalShow} board={this.state.boardSelected} reShow={() => this.setState({ shareModalShow: true })} onHide={() => this.setState({ shareModalShow: false })} />
      </div>
    )
  }
}
class BoardList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isLoggedIn: null
    }
  }
  render() {
    return (
      <div className="board-list row">
        <div id="wrapper">
          <AuthrorizedContent {...this.props} />
          {/* <div className="row">
            <div className="col-lg-12">
              <div className="wrapper wrapper-content">
                <div className="row">
                  <div className="ibox float-e-margins">
                    <div className="ibox-title">
                      <h5>Logs</h5>
                    </div>
                    <div className="ibox-content">
                      <div id="log"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    )
  }
}



export default BoardList
