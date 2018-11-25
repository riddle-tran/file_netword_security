import React, { Component } from 'react'
import Dropzone from 'react-dropzone'
import * as firebase from 'firebase'
import { connect } from 'react-redux'
import ActionTypes from '@/store/Action'
import i18next from 'i18next'
import store from '@/store/store'
import regex from '@/regex/regex'
import toastr from 'toastr/build/toastr.min.js'
import { translate } from 'react-i18next'
import '@/stylesheets/components/PersonalSettings.css'
import api from '@/requester/api'


class IDPSettings extends Component {
  constructor(props) {
    super(props)
    this.baseRef = firebase.database().ref('tenants/' + btoa(this.props.permission.tenant))
    this.state = {
      fileXML: null,
      errEntityURL: false,
      errLoginURL: false,
      errLogoutURL: false,
      errPasswordURLF: false,
      errPasswordURLT: false,
      valPasswordURLF: null,
      valPasswordURLT: null,
      entityURL: "",
      loginURL: "",
      logoutURL: null,
      errCertificate: false,
      certificate: null,
      nameCertificate: "",
      enableSAML: false,
      nameID: "mail",
      fileName: null
    }
  }

  componentWillMount() {
    this.baseRef.child('configurate').once('value', (snapshot) => {
      this.init(snapshot.val())
    })
  }
  //configurate data firebase on state
  init(data) {
    if (data != null) {
      this.spID.value = data['entityID']
      this.spACS.value = data['acs']
      this.spLogout.value = data['logout']
      this.TenantURL.value = data['tenantURL']
      this.tenantDomain.value = data['tenantDomain']
      this.baseRef.child('idpsetting').once('value', (snapshot) => {
        if (snapshot.val()) {
          let dataIDP = snapshot.val()
          this.setState(
            {
              ...dataIDP,
              valPasswordURLF: dataIDP['passwordURL'] ? dataIDP['passwordURL'] : null,
              valPasswordURLT: dataIDP['passwordURL'] ? dataIDP['passwordURL'] : null
            }, () => {
              if (this.state.passwordURL) {
                this.setValuePass("passwordURLF")
                this.setValuePass("passwordURLT")
              }
              this.nameEntityURL.value = this.state.entityURL
              this.nameLoginURL.value = this.state.loginURL
              this.nameLogoutURL.value = this.state.logoutURL
            }
          )
        }
      })
    }
  }
  componentWillUnmount() {

  }
  //open folder select metadata file
  uploadXML() {
    this.refs.dropzoneXML.open()
  }
  uploadCertificate() {
    this.refs.dropzoneCert.open()
  }
  // check syntax URL
  checkURL = (e) => {
    return regex.url.test(e)
  }
  onDropXML(file) {
    if (file.length === 1) {
      this.setState({
        fileXML: file[0],
        fileName: file[0].name

      })
    }
  }
  onDropCert(file) {
    if (file.length === 1) {
      var fr = new FileReader();
      fr.onload = (e) => {
        this.setCertificate(e.target.result);
      };
      fr.readAsText(file[0]);

    }
  }

  // save data on firebase with metadata file
  save() {
    if (this.props.permission.tenant) {
      if (this.state.fileXML !== null) {
        firebase.storage().ref().child('TenatID/' + btoa(this.props.permission.tenant)).put(this.state.fileXML).then((snapshot) => {
          this.updateFileTenantIDInfo(snapshot.downloadURL)
        }).catch((error) => {
          console.log(error)
        })
      } else {
        this.updateFileTenantIDInfo()
      }
    } else {
      toastr.error(this.props.t('error.tenant'))
    }
  }

  updateFileTenantIDInfo(fileURL) {
    if (this.state.fileName) {
      var updates = {}
      if (fileURL) {
        updates['fileURL'] = fileURL
        updates['fileName'] = this.state.fileName
      }
      updates['enableSAML'] = this.state.enableSAML
      if (this.state.errPasswordURLF === true) {
        this.nameInputPassF.focus()
        toastr.error(this.props.t('error.changePassword'))
        return
      } else {
        updates['passwordURL'] = this.nameInputPassF.value
      }
      updates['nameID'] = this.state.nameID
      this.baseRef.child('idpsetting').update(updates, (error) => {
        if (error) {
          console.log(error)
        } else {
          toastr.success(this.props.t('msg.updateSuccess'))
        }
      })
    } else {
      toastr.error(this.props.t('error.metadata'))
    }
  }
  // save data on firebase with data text
  updateTextTenantIDInfo() {
    if (this.props.permission.tenant) {
      var updates = {}
      updates['enableSAML'] = this.state.enableSAML
      if (this.state.errCertificate == true) {
        toastr.error(this.props.t('error.certificate'))
        return
      } else {
        updates['certificate'] = this.state.certificate
        updates['nameCertificate'] = this.state.nameCertificate
      }
      if (this.state.errEntityURL === true || this.state.entityURL === "") {
        this.nameEntityURL.focus()
        toastr.error(this.props.t('error.entityURL'))
        return
      } else {
        updates['entityURL'] = this.state.entityURL
      }
      if (this.state.errLoginURL === true || this.state.loginURL === "") {
        this.nameLoginURL.focus()
        toastr.error(this.props.t('error.loginURL'))
        return
      } else {
        updates['loginURL'] = this.state.loginURL
      }
      if (this.state.errLogoutURL === true || this.state.logoutURL === "") {
        this.nameLogoutURL.focus()
        toastr.error(this.props.t('error.logoutURL'))
        return
      } else {
        updates['logoutURL'] = this.state.logoutURL
      }
      if (this.state.errPasswordURLT === true) {
        this.nameInputPassT.focus()
        toastr.error(this.props.t('error.changePassword'))
        return
      } else {
        updates['passwordURL'] = this.nameInputPassT.value
      }
      updates['nameID'] = this.state.nameID
      this.baseRef.child('idpsetting').update(updates, (error) => {
        if (error) {
          console.log(error)
        } else {
          toastr.success(this.props.t('msg.updateSuccess'))
        }
      })
    } else {
      toastr.error(this.props.t('error.tenant'))
    }
  }
  //notiffications if URL have error
  setElementErr = (key, value) => {
    let bool = !this.checkURL(value.toLowerCase())
    switch (key) {
      case 'errPasswordURLF':
        if (bool === true && value) {
          this.setState({
            errPasswordURLF: bool
          })
        } else {
          this.setState({
            errPasswordURLF: false,
            valPasswordURLF: value
          })
        }
        break;
      case 'errPasswordURLT':
        if (bool === true && value) {
          this.setState({
            errPasswordURLT: bool
          })
        } else {
          this.setState({
            errPasswordURLT: false,
            valPasswordURLT: value
          })
        }
        break;
      case 'errEntityURL':
        if (bool === true && value) {
          this.setState({
            errEntityURL: bool
          })
        } else {
          this.setState({
            errEntityURL: false,
            entityURL: value
          })
        }
        break;
      case 'errLoginURL':
        if (bool === true && value) {
          this.setState({
            errLoginURL: bool
          })
        } else {
          this.setState({
            errLoginURL: false,
            loginURL: value
          })
        }
        break;
      case 'errLogoutURL':
        if (bool === true && value) {
          this.setState({
            errLogoutURL: bool
          })
        } else {
          this.setState({
            errLogoutURL: false,
            logoutURL: value
          })
        }
        break;
      default:
        break;
    }
  }


  //set value certificate when certificate is true
  setCertificate(value) {
    let certX509 = value
    if (certX509 === "") {
      this.setState({
        errCertificate: false,
        nameCertificate: ""
      })
    } else {
      api.post('certificateX509', JSON.stringify(certX509)).then(res => {
        if (res.data === "") {
          this.setState({
            errCertificate: true
          })
        } else {
          const data = res.data.Issuer
          let obj = {}
          if (data) {
            if (data['CommonName']) {
              obj.CN = data['CommonName']
            }
            if (data['Country']) {
              obj.C = data['Country']
            }
            if (data['Locality']) {
              obj.L = data['Locality']
            }
            if (data['Organization']) {
              obj.O = data['Organization']
            }
            if (data['OrganizationalUnit']) {
              obj.OU = data['OrganizationalUnit']
            }
          }
          this.setState({
            certificate: res.data.Raw,
            errCertificate: false,
            nameCertificate: JSON.stringify(obj)
          })
        }
      }).catch((error) => {
      })
    }
  }
  // activite saml ?
  handleCheckbox(value) {
    this.setState({
      enableSAML: value
    })
  }
  // choose value authentication on service provider
  handleSelect(value) {
    this.setState({
      nameID: value
    })
  }
  // check URL password
  setValuePass(value) {
    if (value == "passwordURLF") {
      !this.state.errPasswordURLF ? (
        this.setState({
          errPasswordURLT: false
        }, () => { this.nameInputPassT.value = this.state.valPasswordURLF })
      ) : null
    } else if (value == "passwordURLT") {
      !this.state.errPasswordURLT ? (
        this.setState({
          errPasswordURLF: false
        }, () => { this.nameInputPassF.value = this.state.valPasswordURLT })
      ) : null
    }
  }
  copyToClipboard = (e, value) => {
    if (value === "spACS") {
      this.spACS.select();
    } else if (value === "spLogout") {
      this.spLogout.select();
    } else if (value === "spID") {
      this.spID.select();
    } else if (value === "tenantURL") {
      this.TenantURL.select();
    } else if (value === "tenantDomain") {
      this.tenantDomain.select();
    }

    document.execCommand('copy');
    // This is just personal preference.
    // I prefer to not show the the whole text area selected.
    e.target.focus();
  };
  deleteMetadata = () => {
    firebase.storage().ref().child('TenatID/' + btoa(this.props.permission.tenant)).delete().then(() => {
      let updates = {
        fileURL: null,
        fileName: null
      }
      this.baseRef.child('idpsetting').update(updates, (error) => {
        if (error) {
          console.log(error)
        } else {
          this.setState({
            fileName: null,
            fileURL: null
          })
        }
      })
      // File deleted successfully
    }).catch((error) => {
      // Uh-oh, an error occurred!
      this.setState({
        fileName: null,
        fileURL: null
      })
    });

  }
  deleteCert = () => {
    let updates = {
      certificate: null,
      nameCertificate: null
    }
    this.baseRef.child('idpsetting').update(updates, (error) => {
      if (error) {
        console.log(error)
      }
    })
    this.setState({
      certificate: null,
      nameCertificate: null
    })
  }
  render() {
    const nameid = (
      <div className="form-group">
        <label >{this.props.t('title.nameID')}</label>
        <select className="form-control m-b" value={this.state.nameID} onChange={(e) => this.handleSelect(e.target.value)}>
          <option value="mail">{this.props.t('select.mail')}</option>
          <option value="userid">{this.props.t('select.userId')}</option>
          <option value="userid@tenant">{this.props.t('select.tenant')}</option>
        </select>
      </div>
    )
    // const other = this.state.nameID === "other" ? (
    //     <div className="form-group">
    //         <div className={this.state.errEntityURL ? 'has-error' : ''}>
    //             <input type="text" placeholder="Enter NameID" className="form-control" />
    //         </div>
    //     </div>
    // ) : null
    const enableSAML = (
      <div className="col-sm-3">
        <div className="form-group checkbox">
          <input type="checkbox" checked={this.state.enableSAML} onChange={(e) => this.handleCheckbox(e.target.checked)} />
          <label>{this.props.t('title.enableSAML')}</label>
        </div>
      </div>
    )
    const nameCert = this.state.errCertificate ? (
      <label style={{ color: "red" }}>{this.props.t('error.certificate')}</label>
    ) : (

        this.state.nameCertificate ?
          <div className="row" style={{ display: 'flex' }}>
            <div className="col-sm-12"> <label>[Subject]: {this.state.nameCertificate}</label></div>
            <div className="col-sm-2 ">
              <a href="javascript:void(0)" onClick={() => this.deleteCert()}>{this.props.t('btn.delete')}</a>
            </div>
          </div> : null
      )
    const uploadCert = this.state.nameCertificate ? (
      <div className="form-group">
        <a href="javascript:void(0)" onClick={() => this.uploadCertificate()} >{this.props.t('btn.uploadFile')} </a>
        <Dropzone ref="dropzoneCert" accept="" multiple={false} style={{ display: 'none' }}
          onDrop={this.onDropCert.bind(this)}>
        </Dropzone>
      </div>
    ) : (
        <div className="form-group">
          <Dropzone ref="dropzoneCert" accept="" multiple={false}
            onDrop={this.onDropCert.bind(this)}>
            <p>{this.props.t("btn.uploadFile")}</p>
          </Dropzone>
        </div>
      )
    const text = (
      <div className="ibox-content" style={{}}>
        <div className="row" style={{ marginBottom: "40px" }}>
          {enableSAML}
          <div className="col-sm-6 ">
            <form className="form-horizontal">
              <label>{this.props.t('title.certificate')}</label>
              <br></br>
              {nameCert}
            </form>
            <form role="form">
              {uploadCert}
              {/* <div className="form-group"><label>SAML Signature Algorithm</label>
                <select className="form-control m-b" >
                  <option>SHA-1</option>
                  <option>SHA-256</option>
                  <option>SHA-384</option>
                  <option>SHA-512</option>
                </select>
              </div> */}
              <div className="form-group">
                <label>{this.props.t('title.entityURL')}</label>
                <div className={this.state.errEntityURL ? 'has-error' : ''}>
                  <input
                    ref={(input) => { this.nameEntityURL = input }}
                    onFocus={(e) => { e.target.select() }}
                    onChange={(e) => { this.setElementErr("errEntityURL", e.target.value) }}
                    placeholder={this.props.t('placeholder.entityURL')} className="form-control" />
                </div>
              </div>
              <div className="form-group">
                <label>{this.props.t('title.loginURL')}</label>
                <div className={this.state.errLoginURL ? 'has-error' : ''}>
                  <input ref={(input) => { this.nameLoginURL = input }}
                    onFocus={(e) => { e.target.select() }}
                    onChange={(e) => { this.setElementErr("errLoginURL", e.target.value) }}
                    placeholder={this.props.t('placeholder.loginURL')} className="form-control" />
                </div>
              </div>
              <div className="form-group">
                <label>{this.props.t('title.logoutURL')}</label>
                <div className={this.state.errLogoutURL ? 'has-error' : ''}>
                  <input ref={(input) => { this.nameLogoutURL = input }}
                    onFocus={(e) => { e.target.select() }}
                    onChange={(e) => { this.setElementErr("errLogoutURL", e.target.value) }}
                    placeholder={this.props.t('placeholder.logoutURL')} className="form-control" />
                </div>
              </div>
              <div className="form-group">
                <label>{this.props.t('title.changePassword')}</label>
                <div className={this.state.errPasswordURLT ? 'has-error' : ''}>
                  <input type="text"
                    ref={(input) => { this.nameInputPassT = input }}
                    onFocus={(e) => { e.target.select() }}
                    onChange={(e) => { this.setElementErr("errPasswordURLT", e.target.value) }}
                    onBlur={() => this.setValuePass("passwordURLT")} placeholder={this.props.t('placeholder.changePassword')} className="form-control" />
                </div>
              </div>
              {nameid}
              {/* {other} */}
              <div className="form-group" style={{ marginTop: '40px' }}>
                <div className="col-xs-offset-4 col-xs-6 col-sm-offset-6 col-sm-6">
                  <div className="btn btn-sm btn-primary m-t-n-xs" onClick={() => { this.updateTextTenantIDInfo() }}>
                    <strong>{this.props.t('btn.save')}</strong>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
    const file = (
      <div className="ibox-content" style={{}}>
        <div className="row" style={{ marginBottom: "40px" }}>
          {enableSAML}
          <div className="col-sm-6 ">
            <form role="form">
              <div className="form-group"><label>{this.props.t('title.metadata')}</label>
                <div >
                  <a href="javascript:void(0)" onClick={() => this.uploadXML()} >{this.props.t('btn.uploadFile')} </a>
                  <div className="row" style={this.state.fileName ? { display: 'flex' } : { display: 'none' }}>
                    <div className="col-sm-12 "> {this.state.fileName}</div>
                    <div className="col-sm-3 ">
                      <a href="javascript:void(0)" onClick={() => this.deleteMetadata()}>{this.props.t('btn.delete')}</a>
                    </div>
                  </div>
                  <Dropzone ref="dropzoneXML" accept="text/xml" multiple={false}
                    onDrop={this.onDropXML.bind(this)} style={{ display: 'none' }}>
                  </Dropzone>
                </div>
              </div>
              <div className="form-group">
                <label>{this.props.t('title.changePassword')}</label>
                <div className={this.state.errPasswordURLF ? 'has-error' : ''}>
                  <input type="text"
                    ref={(input) => { this.nameInputPassF = input }}
                    onFocus={(e) => { e.target.select() }}
                    onChange={(e) => { this.setElementErr("errPasswordURLF", e.target.value) }}
                    onBlur={() => this.setValuePass("passwordURLF")} placeholder={this.props.t('placeholder.changePassword')} className="form-control" />
                </div>
              </div>
              {nameid}
              {/* {other} */}
              <div className="form-group" style={{ marginTop: '40px' }}>
                <div className="col-xs-offset-4 col-xs-6 col-sm-offset-6 col-sm-6">
                  <div className="btn btn-sm btn-primary m-t-n-xs" onClick={() => { this.save() }}>
                    <strong>{this.props.t('btn.save')}</strong>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

      </div>
    )
    const sp = (
      <div className="ibox-content" style={{}}>
        <div className="row" style={{ marginBottom: "40px" }}>
          <form role="form">
            <div className="form-group">
              <label>{this.props.t('title.tenantid')}</label>
              <div className="row"  >
                <div className="col-sm-11 col-xs-10 ">
                  <input className="form-control" ref={(input) => { this.TenantURL = input }}
                    readOnly />
                </div>
                <div className="col-sm-1 col-xs-1" style={{ borderStyle: 'groove' }}
                  onClick={(e) => { this.copyToClipboard(e, "tenantURL") }}>
                  <i className="fa fa-copy"></i>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>{this.props.t('title.access')}</label>
              <div className="row"  >
                <div className="col-sm-11 col-xs-10 ">
                  <input className="form-control" ref={(input) => { this.tenantDomain = input }}
                    readOnly />
                </div>
                <div className="col-sm-1 col-xs-1" style={{ borderStyle: 'groove' }}
                  onClick={(e) => { this.copyToClipboard(e, "tenantDomain") }}>
                  <i className="fa fa-copy"></i>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>{this.props.t('title.spID')}</label>
              <div className="row"  >
                <div className="col-sm-11 col-xs-10 ">
                  <input className="form-control" ref={(input) => { this.spID = input }}
                    readOnly />
                </div>
                <div className="col-sm-1 col-xs-1" style={{ borderStyle: 'groove' }}
                  onClick={(e) => { this.copyToClipboard(e, "spID") }}>
                  <i className="fa fa-copy"></i>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>{this.props.t('title.acs')}</label>
              <div className="row"  >
                <div className="col-sm-11 col-xs-10 ">
                  <input className="form-control" ref={(input) => { this.spACS = input }}
                    readOnly />
                </div>
                <div className="col-sm-1 col-xs-1" style={{ borderStyle: 'groove' }}
                  onClick={(e) => { this.copyToClipboard(e, "spACS") }}>
                  <i className="fa fa-copy"></i>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>{this.props.t('title.logoutURL')}</label>
              <div className="row"  >
                <div className="col-sm-11 col-xs-10 ">
                  <input className="form-control" ref={(input) => { this.spLogout = input }}
                    readOnly />
                </div>
                <div className="col-sm-1 col-xs-1" style={{ borderStyle: 'groove' }}
                  onClick={(e) => { this.copyToClipboard(e, "spLogout") }}>
                  <i className="fa fa-copy"></i>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    )
    return (
      <div>
        <ul className="nav nav-tabs">
          <li className="active col-sm-4 col-xs-4" style={{ padding: "0px" }}><a data-toggle="tab" href="#tab-1"> {this.props.t('title.uploadFile')}</a></li>
          <li className=" col-sm-4 col-xs-4" style={{ padding: "0px" }}><a data-toggle="tab" href="#tab-2">{this.props.t('title.inputText')}</a></li>
          <li className=" col-sm-4 col-xs-4" style={{ padding: "0px" }}><a data-toggle="tab" href="#tab-3">{this.props.t('title.configurate')}</a></li>
        </ul>
        <div className="tabs-container">
          <div className="tab-content">
            <div id="tab-1" className="tab-pane active">
              <div className="panel-body">
                {file}
              </div>
            </div>
            <div id="tab-2" className="tab-pane">
              <div className="panel-body">
                {text}
              </div>
            </div>
            <div id="tab-3" className="tab-pane">
              <div className="panel-body">
                {sp}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
function mapStateToProps(state) {
  return {
    lng: state.lng,
    permission: state.permission
  }
}

export default translate('idp-settings')(connect(mapStateToProps)(IDPSettings))
