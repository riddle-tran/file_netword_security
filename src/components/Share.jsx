import React, { Component } from 'react'
import * as firebase from 'firebase'
import { connect } from 'react-redux'
import toastr from 'toastr/build/toastr.min.js'
import '@/stylesheets/components/ShareBoard.css'
class ShareContent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      boardList: [],
      uid: firebase.auth().currentUser.uid
    }
  }

  componentDidMount() {
    this._mounted = true
    this.listenShareList()
  }
  componentWillUnmount() {
    this._mounted = false
    this.boardListRef.off()
  }

  listenShareList() {
    this.boardListRef = firebase.database().ref('whiteboard/invitations/' + this.state.uid)
    this.boardListRef.on('value', (snapshot) => {
      if (this._mounted) this.setState({ boardList: [] }, () => {
        var i = 0;
        snapshot.forEach((childSnapshot, ) => {
          var pos = Object.keys(snapshot.val()).length - i++
          this.boardInfos = firebase.database().ref('whiteboard/board_infos/' + childSnapshot.key)
          this.boardInfos.once('value', (boardInfo) => {
            if (boardInfo.val()) {
              var board = boardInfo.val()
              board.id = childSnapshot.key
              var tempList = this.state.boardList
              tempList[pos] = board
              if (this._mounted) this.setState({
                boardList: tempList
              })
              firebase.database().ref('users').orderByKey().equalTo(board.owner).once('value', (userSnap) => {
                var userInfo = userSnap.val()[board.owner]
                board._ownerName = userInfo.displayName
                var tempList = this.state.boardList
                tempList[pos] = board
                if (this._mounted) this.setState(({
                  boardList: tempList
                }))
              })
            }
          })
        });

      })
    });
  }
  addShare(shareId) {
    var dbWhiteboard = firebase.database().ref('whiteboard')
    var updates = {}
    updates['participations/' + this.state.uid + '/' + shareId] = true
    updates['invitations/' + this.state.uid + '/' + shareId] = null
    dbWhiteboard.update(updates, (error) => {
      if (error) {
        console.log(error.message)
      }
      else console.log("accept invitations succesfully")
    })
    toastr.options = {
      closeButton: true,
      progressBar: true,
      showMethod: 'slideDown',
      timeOut: 4000
    };
    toastr.success("Accept invitations succesfully!");
  }
  deleteShare() {
    var uid = firebase.auth().currentUser.uid
    var dbWhiteboard = firebase.database().ref('whiteboard')
    var updates = {}
    updates['members/' + this.shareId + '/' + uid] = null
    updates['invitations/' + uid + '/' + this.shareId] = null
    dbWhiteboard.update(updates, (error) => {
      if (error) {
        console.log(error.message)
      } else {
        toastr.options = {
          closeButton: true,
          progressBar: true,
          showMethod: 'slideDown',
          timeOut: 4000
        };
        toastr.success("Denied invitations succesfully!");
      }
    })
  }
  deniedShare(boardId, boardName) {
    this.shareId = boardId
    this.refs.deniedContent.textContent = "Are you sure to denied " + boardName + " board?"
  }
  render() {
    const ShareListView = this.state.boardList.map((item, index) => {
      return (
        <tr key={index}>
          <td>{item.name}</td>
          {console.log(item._ownerName)}
          <td>{item._ownerName}</td>
          <td style={{ textAlign: 'center' }} >
            <button type="button" className="btn btn-primary" id="acceptshare" onClick={() => this.addShare(item.id, item.name)}>Accept</button>
            <button type="button" className="btn btn-danger" id='deniedshare' data-toggle="modal" data-target="#deniedShare"
              onClick={() => this.deniedShare(item.id, item.name)}>Denied</button>
          </td>
        </tr>
      )
    })
    return (
      <div id="share_content">
        <div className="row" id="list_panel">
          <div className="col-lg-12">
            <div className="wrapper wrapper-content">
              <div className="row">
                <div className="ibox float-e-margins">
                  <div className="ibox-title">
                    <h5>Shared with me</h5>
                  </div>
                  <div className="ibox-content">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th style={{ width: '30%', textAlign: 'left' }}>Owner Name</th>
                          <th style={{ width: '10%', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody id="list" style={{ maxHeight: '400px' }}>
                        {ShareListView}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal inmodal fade" id="deniedShare" tabIndex="-1" role="dialog" aria-hidden="true">
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header" style={{ padding: '8px' }}>
                <button type="button" className="close" data-dismiss="modal"><span aria-hidden="true">&times;</span>
                  <span className="sr-only">Close</span></button>
              </div>
              <div className="modal-body">
                <div id="contentDenied" ref="deniedContent"></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-white" data-dismiss="modal" >No</button>
                <button type="button" className="btn btn-primary" data-dismiss="modal"
                  onClick={() => this.deleteShare()}>Yes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

class Share extends Component {
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <div className="row">
        <div id="wrapper">
          <ShareContent {...this.props} />
        </div>
      </div>
    )
  }
}
function mapStateToProps(state) {
  return { isLogged: state.isLogged }
}

export default connect(mapStateToProps)(Share)
