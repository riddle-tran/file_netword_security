import React, { Component } from 'react'
import moment from 'moment'
import ShareModal from './ShareModal.jsx'
import * as firebase from 'firebase'
import toastr from 'toastr/build/toastr.min.js'
import '@/stylesheets/components/DeletedBoards.css'

class DeletedBoards extends Component {
  constructor(props) {
    super(props)
    this.state = {
      boardList: [],
      uid: firebase.auth().currentUser.uid,
      shareModalShow: false,
      boardSelected: {},
    }
  }

  componentDidMount() {
    this._mounted = true
    this.boardInfos = []
    this.listenBoardList()
  }

  componentWillUnmount() {
    this._mounted = false
    this.boardListRef.off()
    this.boardInfos.forEach((boardInfo) => {
      boardInfo.off()
    })
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
      this.setState({ boardList: [] }, () => {
        var i = 0;
        snapshot.forEach((childSnapshot, ) => {
          var pos = Object.keys(snapshot.val()).length - i++
          this.boardInfos.push(firebase.database().ref('whiteboard/board_infos/' + childSnapshot.key))
          this.boardInfos[this.boardInfos.length - 1].on('value', (boardInfo) => {
            if (boardInfo.val()) {
              var board = boardInfo.val()
              if (board.isDelete === true && board.owner === this.state.uid) {
                board.id = childSnapshot.key
                var tempList = this.state.boardList
                tempList[pos] = board
                if (this._mounted) this.setState(({
                  boardList: tempList
                }))
                firebase.database().ref('users').orderByKey().equalTo(board.owner).once('value', (userSnap) => {
                  var userInfo = userSnap.val()[board.owner]
                  board._ownerName = userInfo.displayName
                  var tempList = this.state.boardList
                  tempList[pos] = board
                  if (this._mounted) this.setState(({
                    boardList: tempList
                  }))
                })
              } else {
                var tempList = this.state.boardList
                if (tempList[pos]) {
                  var id = tempList[pos].id
                  if (id === childSnapshot.key) {
                    tempList[pos].isDelete = false
                    if (this._mounted) {
                      this.setState(({
                        boardList: tempList
                      }))
                    }
                  }
                }
              }
            }
          })
        });
      })
    });
  }

  deleteBoard() {
    var boardId = this.state.boardIdDelete
    var db = firebase.database().ref('whiteboard')
    const uid = firebase.auth().currentUser.uid
    db.child('boards/' + boardId).once('value', (boardVal) => {
      var files = boardVal.val() ? boardVal.val().files : null
      db.child('members/' + boardId).once('value', (boards) => {
        var updates = {}
        updates['boards/' + boardId] = null
        updates['board_infos/' + boardId] = null
        var boardsVal = boards.val()
        for (var key in boardsVal) {
          updates['members/' + boardId + '/' + key] = null
        }
        for (var key in boardsVal) {
          updates['participations/' + key + '/' + boardId] = null
          updates['invitations/' + key + '/' + boardId] = null
        }
        db.update(updates, (error) => {
          if (error) {
            console.log(error)
          } else {
            if (files) {
              for (var key in files) {
                firebase.storage().ref().child('board/' + boardId + '/' + key).delete().then((error) => { })
              }
            }
            toastr.success("Permanently delete Successfully")
          }
        })
      })
    })
  }

  handleSelect(boardId) {
    this.props.history.push('/app/edit-board/' + boardId)
  }

  setBoardDeleteContent(boardId, boardName) {
    this.setState({
      boardIdDelete: boardId
    })
    $('#deleteBoardContent').text("are you sure to  permanently delete " + boardName + " board?")
  }

  showModalShare(board) {
    this.setState({
      shareModalShow: true,
      boardSelected: board
    })
  }

  restoreBoard(boardId) {
    var updates = {}
    updates['board_infos/' + boardId + '/isDelete'] = false
    firebase.database().ref('whiteboard').update(updates, (error) => {
      if (error) {
        //
      } else {
        toastr.success("Restore Successfully")
      }
    })
  }

  render() {
    const BoardListView = this.state.boardList.map((item, index) => {
      return (
        item.isDelete !== false
          ? <tr key={index}>
            <td onClick={() => { this.handleSelect(item.id) }} style={{ cursor: 'pointer', verticalAlign: 'middle' }}>{item.name}</td>
            <td onClick={() => { this.handleSelect(item.id) }} style={{ cursor: 'pointer', verticalAlign: 'middle' }}>{item._ownerName}</td>
            <td onClick={() => { this.handleSelect(item.id) }} style={{ cursor: 'pointer', verticalAlign: 'middle' }}>{moment(item.deletedTime).format('LLL')}</td>
            <td style={{ verticalAlign: 'middle' }}>
              <div className="note-btn-group btn-group">
                <div className="note-btn-group btn-group note-para dropdown-toggle" data-toggle="dropdown">
                  <button type="button" className="note-btn btn btn-default btn-sm">...</button>
                </div>
                <div className="dropdown-menu dropdown-user" style={{ left: '-128px', marginTop: '5px' }}>
                  <li onClick={() => this.restoreBoard(item.id)}><a href="javascript:void(0);">
                    Restore
                  </a></li>
                  <li onClick={() => this.showModalShare(item)}><a href="javascript:void(0);">
                    Share
                  </a></li>
                  <li data-toggle="modal"
                    data-target="#modalLoginFail"><a href="javascript:void(0);"
                      onClick={() => this.setBoardDeleteContent(item.id, item.name)}
                      style={this.state.uid !== item.owner ? { display: 'none' } : {}}>
                      Permanently delete
                    </a></li>
                </div>
              </div>
            </td>
          </tr> : <tr key={index} style={{ display: 'none' }}></tr>
      )
    })
    return (
      <div className="deleted-board-list row">
        <div id="wrapper">
          <div id="authrorized_content">
            <div className="row" id="list_panel">
              <div className="col-lg-12">
                <div className="wrapper wrapper-content">
                  <div className="row">
                    <div className="ibox float-e-margins">
                      <div className="ibox-title">
                        <h5>Deleted Boards</h5>
                      </div>
                      <div className="ibox-content">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th style={{ width: '140px', textAlign: 'left' }}>Owner Name</th>
                              <th style={{ width: '150px', textAlign: 'left' }}>Deleted Time</th>
                              <th style={{ width: '100px', textAlign: 'left' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody id="list" style={{ maxHeight: '400px' }}>
                            {BoardListView}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
          </div>
        </div>
        <ShareModal show={this.state.shareModalShow} board={this.state.boardSelected} reShow={() => this.setState({ shareModalShow: true })} onHide={() => this.setState({ shareModalShow: false })} />
      </div>
    )
  }
}

export default DeletedBoards
