import React, { Component } from 'react'
import * as firebase from 'firebase'
import classNames from 'classnames';
import ReactSelect, { Value } from 'react-select'
import 'react-select/dist/react-select.css'

import regex from '@/regex/regex'
import { defaultAvtPath } from '@/const/AppConst.jsx'

import '@/stylesheets/components/CollaboratorsSelect.css'

class ValueView extends Value {
  render() {
    return (
      <div className={classNames('Select-value', this.props.value.className)}
        style={this.props.value.style}
        title={this.props.value.title}
      >
        {this.renderLabel()}
        {this.renderRemoveIcon()}
      </div>
    );
  }
}

class CollaboratorsSelect extends Component {
  constructor(props) {
    super(props)
    this.loadOptions = this.loadOptions.bind(this)
    this.onChange = this.onChange.bind(this)
    this.isValidNewOption = this.isValidNewOption.bind(this)
  }

  onChange(inputValue) {
    for (let index = 0; index < inputValue.length; index++) {
      if (inputValue[index].className === 'Select-create-option-placeholder') {
        inputValue[index].displayName = inputValue[index].email = inputValue[index].value = inputValue[index].value.toLowerCase().trim()
      }
    }
    this.props.onChange(inputValue)
  }

  loadOptions(input, callback) {
    this.canCreateNewOption = false
    input = input.toLowerCase().trim()
    if (!input) {
      callback(null, { options: [], complete: true })
      return
    }
    var emailDb = input.replace(/\./g, "%2E")
    if (this.loadingOptionsTimeout) clearTimeout(this.loadingOptionsTimeout)
    this.loadingOptionsTimeout = setTimeout(() => {
      firebase.database().ref('emails').orderByKey().equalTo(emailDb).once('value').then((emailsSnap) => {
        var options = []
        this.canCreateNewOption = !emailsSnap.val()
        if (this.canCreateNewOption) {
          callback(null, { options, complete: true })
          return
        } else {
          var uid = emailsSnap.val()[emailDb]
          if (!this.props.except || !this.props.except.find(x => x.uid === uid)) {
            firebase.database().ref('users').orderByKey().equalTo(uid).once('value').then((usersSnap) => {
              if (usersSnap.val()) {
                let user = usersSnap.val()[uid]
                user.uid = uid
                user.value = user.email
                user.photoURL = user.photoURL === 'default' ? defaultAvtPath : user.photoURL
                options.push(user)
              }
              callback(null, { options, complete: true })
            })
          } else {
            callback(null, { options, complete: true })
          }
        }
      }).catch((err) => {
        this.canCreateNewOption = err.code === "PERMISSION_DENIED"
        callback(null, { options: [], complete: true })
      })
    }, 600)
  }

  isValidNewOption({ label }) {
    return regex.email.test(label ? label.toLowerCase().trim() : label) && this.canCreateNewOption
  }

  renderOption(option) {
    if (!option.uid) return option.value
    return (
      <div className="row" style={{ margin: 0 }}>
        <div className="col-sm-2 no-padding" style={{ margin: "2px 0", width: 'auto' }}>
          <img alt="image" className="img-circle" src={option.photoURL} style={{ width: '32px', height: '32px' }} />
        </div>
        <div className="col-sm-10">
          <div className="row">
            <div className="col-sm-12" style={{ padding: "0 10px" }}>{option.displayName}</div>
            <div className="col-sm-12" style={{ padding: "0 10px" }}>{option.value}</div>
          </div>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="collaborators-select">
        <ReactSelect.AsyncCreatable
          multi={true}
          value={this.props.value}
          onChange={this.onChange}
          valueKey="value"
          labelKey="displayName"
          loadOptions={this.loadOptions}
          promptTextCreator={label => `"${label ? label.toLowerCase().trim() : label}"`}
          isValidNewOption={this.isValidNewOption}
          disabled={this.props.disabled}
          cache={false}
          arrowRenderer={null}
          optionRenderer={this.renderOption}
          valueComponent={ValueView}
          placeholder={"Email"}
          searchPromptText=""
          loadingPlaceholder={"Loading..."}
        />
      </div>
    )
  }
}

export default CollaboratorsSelect
