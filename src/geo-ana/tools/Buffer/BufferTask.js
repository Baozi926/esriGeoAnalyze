define([
  'dojo/Evented',
  'dojo/promise/all',
  'dojo/_base/Deferred',
  'dojo/_base/lang',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/_base/declare',
  'dojo/_base/array',
  'esri/request',
  '../../arcgisUtil'
], function (Evented, all, Deferred, lang, _WidgetBase, _TemplatedMixin, declare, ArrayUtil, esriRequest, arcgisUtil) {
  var widget = declare('caihm.spatialAna.Buffer', [], {
    debug: false,
    _jobDone: false, //监测任务是否运行完毕的参数
    //任务运行时临时参数
    portalItemId: '',
    jobId: '',
    //需传入的参数
    analyzeService: '',
    token: '',
    username: '',
    inputLayer: '',
    portalUrl: '',
    exportService: {
      name: '',
      type: 'Feature Service'
    },
    param: {},

    setAnalyzeService(param) {
      this.analyzeService = param.url;
      return this;
    },
    setPortalUrl(param) {
      this.portalUrl = param.url;
      return this;
    },

    setUser(param) {
      this.username = param.username;
      this.token = param.token;
      return this;
    },
    /**
     * 运行缓冲区运算任务
     * @param {Object} token username inputLayer exportServiceName
     * @returns {Promise}
     *
    */
    run: function (param) {

      this._jobDone = false;
      param = param || {}
      if (this.debug) {
        //测试
        this.exportService.name = 'testService_' + new Date()
          .getTime()
          .toString(16);
        this.analyzeService = 'https://esri.chm.com/arcgis';
        this.username = 'portal123'
        this.inputLayer = 'https://esri.chm.com/arcgis/rest/services/test/testPoint/MapServer/2'
      } else {
        this.exportService.name = param.exportService.name;
        this.inputLayer = param.inputLayer;
        this.distances = param.distances;
        this.units = param.units;
        this.context = param.context;
        this.field = param.field;
        this.dissolveType = param.dissolveType;
        this.folderId = param.folderId;

      }
      if (param.token) {
        this.token = param.token;
      }

      var dfd = new Deferred()

      var dfds = [
        this._validUser(),
        this._validexportServiceName()
      ]

      all(dfds).then(lang.hitch(this, function (res) {

        this
          ._createService()
          .then(lang.hitch(this, function () {
            this._validCreateService_times = 0;
            this
              ._validCreateService()
              .then(lang.hitch(this, function () {
                this._updateCreatePortalItem();
                this
                  ._submitJob()
                  .then(lang.hitch(this, function () {

                    console.log('watchUrl:' + this.analyzeService + '/CreateBuffers/jobs/' + this.jobId);
                    var evt = this._watchingJob();
                    //任务运行消息处理
                    evt.on('msg', lang.hitch(this, function (msg) {
                      console.log(msg)
                    }));
                    //任务完成
                    evt.on('success', lang.hitch(this, function () {
                      dfd.resolve({success: true, serviceUrl: this.param.createServiceUrl});
                    }))
                    //任务失败
                    evt.on('error', lang.hitch(this, function (res) {
                      this._removeCreatedService();
                      var msg = '';

                      ArrayUtil.forEach(res.messages, function (v, k) {
                        msg += k + ': ' + v.description + '\n';
                      }, this);
                      console.log(msg);
                      dfd.reject(msg);
                    }))
                  }), lang.hitch(this, function (err) {
                    this._removeCreatedService();
                    dfd.reject(err)
                  }));

              }), function (errs) {
                dfd.reject(errs)
              })
          }), function (errs) {
            dfd.reject(errs)
          });

      }), lang.hitch(this, function (errs) {
        dfd.reject(errs)

      }))
      return dfd;
    },
    //删除创建的图层
    _removeCreatedService: function () {

      if (this.portalItemId) {

        var url = this.portalUrl + '/sharing/rest/content/users/' + this.username + '/items/' + this.portalItemId + '/delete'
        esriRequest(url, {
          query: {
            token: this.token,
            f: 'json'
          },
          method: 'post'
        }).then(lang.hitch(this, function (res) {
          if (res.success) {
            console.log(res.data.itemId + 'removed');
          } else {
            throw new Error('删除portalitem失败')
          }
        }))
      }

    },

    //提交buffer gp
    _submitJob: function () {
      var dfd = new Deferred();
      var url = this.analyzeService + '/CreateBuffers/submitJob';
      var inputLayer = {
        "url": this.inputLayer
      }
      var dissolveType = this.dissolveType === 'None'
        ? 'None'
        : 'Dissolve'
      var distArr = this
        .distances
        .split(',');

      //稍微验证下 距离 参数
      var _distArr = [];
      ArrayUtil.forEach(distArr, function (v) {
        if (!isNaN(v)) {
          _distArr.push(parseFloat(v));
        }
      })

      var distances = _distArr;
      var units = this.units
      var ringType = 'Rings'
      var OutputName = {
        "serviceProperties": {
          "name": this.exportService.name,
          "serviceUrl": this.param.createServiceUrl
        },
        "itemProperties": {
          "itemId": this.portalItemId,
          "folderId": this.folderId
        }
      }

      var context = this.context;

      var param = {
        inputLayer: JSON.stringify(inputLayer),
        dissolveType: dissolveType,
        distances: JSON.stringify(distances),
        units: units,
        ringType: ringType,
        OutputName: JSON.stringify(OutputName),
        context: JSON.stringify(context),
        token: this.token,
        f: 'json'
      }

      esriRequest(url, {
          query: param,
          method: 'get'
        }).then(lang.hitch(this, function (res) {
        this.jobId = res.data.jobId;
        console.log('jobId:' + this.jobId)
        dfd.resolve(res);
      }), function (err) {
        dfd.reject(err)
        // throw new Error(err)
      });

      return dfd;

    },
    //监控gp服务步骤
    _watchingJob: function () {
      if (this._jobDone) {
        return;
      }

      var event = new Evented();

      var url = this.analyzeService + '/CreateBuffers/jobs/' + this.jobId;

      var param = {
        f: 'json',
        token: this.token
      }

      var interval = setInterval(function () {
        esriRequest(url, {
            query: param,
            method: 'get'
          })
          .then(lang.hitch(this, function (res) {
            console.log(res.data);
            event.emit('msg', res.data)
            if (res.data.jobStatus === 'esriJobFailed') {
              window.clearInterval(interval)
              this._jobDone = true;


              
              event.emit('error',res.data)
            } else if (res.data.jobStatus === 'esriJobSucceeded') {
              this._jobDone = true;
              window.clearInterval(interval)
              event.emit('success',res.data)
            }

          }), function (err) {
            throw new Error('gp 执行错误:' + err)
          });
      }, 2000)

      return event;

    },

    //验证用户
    _validUser: function () {
      var dfd = new Deferred();
      var url = this.portalUrl + '/sharing/rest/community/users/' + this.username //portal123
      esriRequest(url, {
          query: {
            f: 'json',
            token: this.token
          }
        }).then(lang.hitch(this, function (res) {
        if (arcgisUtil.isUserhasSpatialAnalysis(res.data)) {
          dfd.resolve(true);
        } else {
          dfd.reject('没有空间分析权限');
        }

      }), function (err) {
        dfd.reject('判断用户权限失败');
      });
      return dfd;
    },
    //验证输出图层的名称
    _validexportServiceName: function () {
      var dfd = new Deferred();
      var url = this.portalUrl + '/sharing/rest/portals/0123456789ABCDEF/isServiceNameAvailable';
      var param = {
        name: this.exportService.name,
        type: this.exportService.type || 'Feature Service',
        f: 'json',
        token: this.token
      }
      esriRequest(url, {query: param}).then(lang.hitch(this, function (res) {
        if (res.data.available) {
          dfd.resolve(true);
        } else {
          dfd.reject('名称已存在');
        }

      }), function (err) {
        dfd.reject('判断名称是否重复失败');
      });
      return dfd;
    },
    //验证图层创建成功
    _validCreateService: function () {
      var dfd = new Deferred();
      this._validCreateService_times++;
      if (this._validCreateService_times > 10) {
        throw new Error('输出图层创建失败')
      }

      var url = this.portalUrl + '/sharing/rest/content/users/' + this.username + '/items/' + this.portalItemId;
      var param = {
        f: 'json',
        token: this.token
      }
      esriRequest(url, {query: param}).then(lang.hitch(this, function (res) {
        if (res.data.item.id === this.portalItemId && res.data.sharing) {
          dfd.resolve()
        } else {
          setTimeout(lang.hitch(this, function () {
            this._validCreateService();
          }), 500)
        }
      }), function (err) {
        dfd.reject();
      });
      return dfd;

    },

    _updateCreatePortalItem: function () {
      var dfd = new Deferred();
      var url = this.portalUrl + '/sharing/rest/content/users/' + this.username + '/items/' + this.portalItemId + '/update'
      var description = '';
      var tags = 'Analysis Result, Buffer, testPoint-XianCh_point'
      var snippet = 'Feature layer generated from Buffer'
      var folder = this.folderId;
      var properties = {
        "jobUrl": this.analyzeService + "/CreateBuffers/jobs/" + this.jobId,
        "jobType": "GPServer",
        "jobId": this.jobId,
        "jobStatus": "processing"
      }

      var param = {
        description: description,
        tags: tags,
        snippet: snippet,
        folder: folder,
        properties: JSON.stringify(properties),
        token: this.token
      }

      esriRequest(url, {
          query: param,
          method: 'post'
        }).then(lang.hitch(this, function (res) {
        dfd.resolve();
      }), function (err) {
        dfd.reject();
      });

      return dfd;

    },

    //创建输出的图层
    _createService: function () {
      console.log('正在创建服务')
      var dfd = new Deferred();
      var url = this.portalUrl + '/sharing/rest/content/users/' + this.username + '/createService';
      var outputType = 'featureService'
      var createParameters = {
        "currentVersion": 10.2,
        "serviceDescription": "",
        "hasVersionedData": false,
        "supportsDisconnectedEditing": false,
        "hasStaticData": true,
        "maxRecordCount": 2000,
        "supportedQueryFormats": "JSON",
        "capabilities": "Query",
        "description": "",
        "copyrightText": "",
        "allowGeometryUpdates": false,
        "syncEnabled": false,
        "editorTrackingInfo": {
          "enableEditorTracking": false,
          "enableOwnershipAccessControl": false,
          "allowOthersToUpdate": true,
          "allowOthersToDelete": true
        },
        "xssPreventionInfo": {
          "xssPreventionEnabled": true,
          "xssPreventionRule": "InputOnly",
          "xssInputRule": "rejectInvalid"
        },
        "tables": [],
        "name": this.exportService.name
      }
      var param = {
        createParameters: JSON.stringify(createParameters),
        outputType: outputType,
        f: 'json',
        token: this.token
      }

      esriRequest(url, {
          query: param,
          method: 'post'
        }).then(lang.hitch(this, function (res) {

        this.portalItemId = res.data.itemId;
        console.log('创建服务成功，itemId:' + this.portalItemId)
        this.param.createServiceUrl = res.data.serviceurl;
        dfd.resolve(res);
      }), function (err) {
        console.log(err)
        dfd.reject('创建服务失败:' + err);
      });

      return dfd;

    }

  });

  return widget;

})