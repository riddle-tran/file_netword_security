import React from 'react'
import * as firebase from 'firebase'
import toastr from 'toastr'

import CollaboratorsContent from './CollaboratorsContent'
import { BoardRules } from '@/const/AppConst.jsx'
import Dropzone from 'react-dropzone'
import '@/stylesheets/components/EditBoard.css'

const previewSmallSize = 24
class AuthrorizedContent extends React.PureComponent {
    constructor(props) {
        super(props)
        this.tableBoardsRef = React.createRef()
        this.state = {
            fileList: {},
            boardName: "",
            permission: BoardRules.view,
            fileIdDelete: null,
            fileNameDelete: null,
        }

        this.boardIdRef = firebase.database().ref('whiteboard/boards/' + this.props.boardId)

    }
    componentDidMount() {
        this.fetchData()
    }
    componentWillUnmount() {
        this.boardIdRef.off()
    }
    fetchData() {
        this.listenFileList()
        firebase.database().ref('whiteboard/board_infos/' + this.props.boardId).on('value', (data) => {

            if (data.val()) {
                this.setState({
                    boardName: data.val()['name']
                })
            }

        })
        firebase.database().ref('whiteboard/members/' + this.props.boardId + "/" + firebase.auth().currentUser.uid).on('value', (data) => {
            if (data.val()) {
                this.setState({
                    permission: data.val().role || BoardRules.view
                })
            }
        })
    }
    listenFileList() {
        this.boardIdRef.once('value', (boards) => {
            let fileList = this.state.fileList
            boards.forEach((snap) => {
                if (snap.val()) {
                    let pos = snap.val()
                    pos.id = snap.key
                    fileList[pos.id] = pos
                }
            })
            this.setState({
                fileList: { ...fileList }
            })
        })
        this.boardIdRef.on('child_added', (snap) => {
            let fileList = this.state.fileList
            if (snap.val()) {
                let pos = snap.val()
                pos.id = snap.key
                fileList[pos.id] = pos
            }
            this.setState({
                fileList: { ...fileList }
            })

        })

        this.boardIdRef.on('child_changed', (snap) => {
            let fileList = this.state.fileList
            if (snap.val()) {
                let pos = snap.val()
                pos.id = snap.key
                fileList[pos.id] = pos
            }
            this.setState({
                fileList: { ...fileList }
            })

        })

        this.boardIdRef.on('child_removed', (snap) => {
            let fileList = this.state.fileList
            if (snap.val()) {
                delete fileList[snap.key]
            }
            this.setState({
                fileList: { ...fileList }
            })

        })
    }
    onDropFile(file) {
        if (file.length === 1) {
            let key = this.boardIdRef.push().key

            firebase.storage().ref().child('whiteboard/boards/' + this.props.boardId + "/" + key + "/" + file[0].name).put(file[0]).then((snapshot) => {

                var updates = {}
                updates['downloadURL'] = snapshot.downloadURL
                updates['name'] = file[0].name
                updates['contentType'] = snapshot.metadata.contentType
                this.boardIdRef.child(key).update(updates, (error) => {
                    if (error) {
                        toastr.success("Failed update")
                    } else {
                        toastr.success("Update file successfully")
                    }
                })
            }).catch((error) => {
                toastr.success("Failed update")
            })
        }
    }
    showFolder() {
        this.refs.dropzoneFile.open()
    }
    setBoardDeleteContent(fileId, fileName) {
        this.setState({
            fileIdDelete: fileId,
            fileNameDelete: fileName,

        })
        $('#deleteFileContent').text("are you sure to delete " + fileName + " board?")
    }
    deleteFile() {
        // Create a reference to the file to delete
        var desertRef = firebase.storage().ref().child('whiteboard/boards/' + this.props.boardId + "/" + this.state.fileIdDelete + "/" + this.state.fileNameDelete);

        // Delete the file
        desertRef.delete().then(() => {
            // File deleted successfully
            var updates = {}
            updates[this.state.fileIdDelete] = null

            firebase.database().ref('whiteboard/boards/' + this.props.boardId).update(updates, (error) => {

                if (error) {
                    console.log(error)
                } else {
                    toastr.success("Delete file successfully")
                }
            })
        }).catch(function (error) {
            // Uh-oh, an error occurred!
        });
    }
    downloadFile(obj) {
        var link = document.createElement("a");
        link.download = obj.name;
        link.href = obj.downloadURL;
        link.type = obj.fileType;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    render() {
        const BoardListView = Object.values(this.state.fileList).map((item, index) => {
            return (
                item.isDelete !== true ?
                    <tr key={index}>
                        <td colSpan="2" style={{ cursor: 'pointer', verticalAlign: 'middle' }}>{item.name}</td>
                        <td style={{ verticalAlign: 'middle' }}>
                            <div className="note-btn-group btn-group">
                                <div className="note-btn-group btn-group note-para dropdown-toggle" data-toggle="dropdown">
                                    <button type="button" className="note-btn btn btn-default btn-sm">...</button>
                                </div>
                                <div className="dropdown-menu dropdown-user" style={{ left: '-128px', marginTop: '5px' }}>
                                    <li data-toggle="modal"><a href="javascript:void(0);"
                                        onClick={() => this.downloadFile(item)}>
                                        Download
                                        </a></li>
                                    <li data-toggle="modal"
                                        data-target="#modalLoginFail"><a href="javascript:void(0);"
                                            onClick={() => this.setBoardDeleteContent(item.id, item.name)}
                                            style={this.state.permission !== BoardRules.view ? {} : { display: 'none' }}>
                                            Delete
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
                                        <h5>Name Board : {this.state.boardName}</h5>
                                    </div>
                                    <div className="ibox-content">
                                        <table ref={this.tableBoardsRef} className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th colSpan="2">Name File</th>
                                                    <th style={{ width: '50px', textAlign: 'left', paddingTop: "0px" }}>
                                                        <button type="button" className="btn btn-primary" style={this.state.permission !== BoardRules.view ? { paddingLeft: '10px', paddingRight: '10px' } : { display: 'none' }} onClick={() => this.showFolder()}>
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
                                                        <div id="deleteFileContent" style={{ wordWrap: 'break-word' }}></div>
                                                    </div>
                                                    <div className="modal-footer">
                                                        <button type="button" className="btn btn-white" data-dismiss="modal">No</button>
                                                        <button type="button" className="btn btn-primary" data-dismiss="modal"
                                                            onClick={() => this.deleteFile()}>Yes</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <Dropzone ref="dropzoneFile" multiple={false}
                                            onDrop={this.onDropFile.bind(this)} style={{ display: 'none' }}>
                                        </Dropzone>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class EditBoard extends React.PureComponent {
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
                    <AuthrorizedContent boardId={this.props.match.params.boardId}
                        onLoading={this.onLoading}
                        onLoaded={this.onLoaded}
                        history={this.props.history}
                    />
                    <div id="Copyright"><strong>Copyright</strong> N14DCAT011-TRAN VAN NAM, Inc. &copy; 2018-2018</div>
                </div >
            </div>
        )
    }
}


export default EditBoard
