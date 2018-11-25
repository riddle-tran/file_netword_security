import * as firebase from 'firebase'
import { fabric } from '@/fabric'
import * as database from '../../database'

export function onFileEvent(type, options) {
  const events = ['object:rotating', 'object:scaling', 'object:moving', 'object:skewing', 'object:modified']
  if (events.indexOf(type) !== -1) {
    let target = options.target
    target.ship = target.ship || {}
    target.ship.id = target.ship.id || this.boardEntity.createNewPathId()
    target.ship.userId = firebase.auth().currentUser.uid
    target.ship.reundo = false

    const id = target.ship.id
    this.allObjects[id] = target
    this.addAllObjectPosition(id)

    let json = target.toObject(['ship'])

    let action = this.boardEntity.getCurAction() || new database.Action(database.Action.getActionType(type, options.transform))
    action.updateActOpt(options.transform)
    action.addOpt(id, this.boardEntity.getOriginalPath(id), json)

    this.boardEntity.updatePath(id, json, action, (error) => error && console.log(error))
    if (type === 'object:modified') {
      var undoObj = {
        action: 'object-modify',
        oldJson: this.oldJson[id],
        json
      }
      this.oldJson[id] = json
      this.pushToUndo(undoObj)
      this.minimap.trigger('minimap:update', $.extend(true, {}, target))
    }
  }
}

export function onFileChangedFromNetwork(obj, newRawObj) {
  Object.assignDeep(obj, newRawObj)
  Object.assignDeep(obj, this.curMouse.objOpts)
}

export function downloadFile(obj) {
  var link = document.createElement("a");
  link.download = obj.fileName;
  link.href = obj.fileURL;
  link.type = obj.fileType;
  link.target = '_blank';
  link.click();
}
