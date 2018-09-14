define([
  'dojo/_base/array',
  'esri/request',
  'dojo/_base/Deferred',
  'dojo/_base/lang',
  'dojo/promise/all',
  'dojo/Evented'
], function (ArrayUtil, esriRequest, Deferred, lang, all, Evented) {

  var HAS_SPATIAL_ANALYSIS = 'premium:user:spatialanalysis'

  var jobWatcherStore = {};
  var intervalStore = {};

  //待完善
  var NUMBER_FIELD_TYPES = ['esriFieldTypeDouble', 'esriFieldTypeSmallInteger', 'esriFieldTypeInteger', 'integer', 'double']
  //待完善
  var ESRI_FEATURE_TYPE = ['esriGeometryPolygon', 'esriGeometryPoint']

  var instance = {

    portalInfo: {},
    numberUnits: [
      {
        name: '米',
        value: 'Meters'
      }, {
        name: '千米',
        value: 'Kilometers'
      }, {
        name: '英尺',
        value: 'Feet'
      }, {
        name: '英里',
        value: 'Miles'
      }, {
        name: '海里',
        value: 'NauticalMiles'
      }, {
        name: '码',
        value: 'Yards'
      }
    ],
    //将http的url强制转换为https
    forceUrlToHttps(serviceUrl) {
      if (serviceUrl.indexOf('https://') !== 0 && serviceUrl.indexOf('http://') === 0) {
        return serviceUrl.replace('http://', 'https://');
      }
    },

    isPointLayer(geometryType) {
      return ArrayUtil.some([
        'esriGeometryPoint', 'point'
      ], function (v) {
        return geometryType === v;
      })
    },

    isNumberFieldType(field) {
      return ArrayUtil.some(NUMBER_FIELD_TYPES, function (v) {
        return field === v;
      })

    },
    getUserInfo(param) {
      var dfd = new Deferred();

      var url = param.portalUrl + '/sharing/rest/content/users/' + param.username + '?f=json&token=' + param.token;
      esriRequest(url).then(function (res) {
        dfd.resolve(res.data)
      })
      return dfd

    },

    isUserhasSpatialAnalysis: function (userInfo) {
      return ArrayUtil.some(userInfo.privileges, function (v) {
        return v.indexOf(HAS_SPATIAL_ANALYSIS) > -1
      }, this);

    },
    getLayerInfo: function (layer, token) {
      var dfd = new Deferred();
      //如果传入的是layer url
      if (lang.isString(layer)) {
        var url = layer + '?f=json&token=' + token;

        esriRequest(url).then(function (res) {

          dfd.resolve(res.data);
        });

      } else {
        //todo
      }

      return dfd

    },

    generateTokenFromPortal(param) {

      var dfd = new Deferred();
      var url = param.portalUrl + '/sharing/rest/generateToken'
      esriRequest(url, {
        query: {
          f: 'json',
          username: param.username,
          password: param.password,
          client: 'requestip',
          expiration: 1440
        },
          method: 'post'
        })
        .then(lang.hitch(this, function (res) {
          instance.token = res.data.token;
          dfd.resolve(instance.token)
        }), function (err) {
          dfd.reject('无法获取portal元数据');
        });
      return dfd;

    },

    createServiceWithValidation(_param) {

      var dfd = new Deferred();

      var param = {
        portalInfo: null,
        portalUrl: null,
        user: {
          username: null,
          token: null
        },
        param: {},
        _validCreateService_times: 0
      }

      lang.mixin(param, _param);

      //判断用户是否有创建service的权限，和service名称是否可用
      var valid_userAuthAndServiceNamePromises = [
        instance.validCreateServiceName(param),
        instance.validUser_CreateService(param)
      ]

      all(valid_userAuthAndServiceNamePromises).then(function (res) {

        instance
          .createService(param)
          .then(function (item) {
            lang.mixin(param, {portalItem: item})

            instance
              .validCreateService(param)
              .then(function (res) {
                //返回创建portalItem 的信息
                dfd.resolve(param.portalItem);
              }, function (err) {
                dfd.reject(err);
              })

          }, function (err) {
            dfd.reject(err);
          })
      }, function (err) {
        dfd.reject(err);
      })

      return dfd;
    },

    validCreateServiceName(param) {
      var dfd = new Deferred();

      var portalId = param.portalInfo && param.portalInfo.id
        ? param.portalInfo.id
        : '0123456789ABCDEF'
      var url = param.portalUrl + '/sharing/rest/portals/' + portalId + '/isServiceNameAvailable';
      var queryParam = {
        name: param.param.exportService.name,
        type: param.param.exportService.type || 'Feature Service',
        f: 'json',
        token: param.user.token
      }
      esriRequest(url, {query: queryParam}).then(lang.hitch(this, function (res) {
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

    validUser_CreateService(param) {
      var dfd = new Deferred();
      var url = param.portalUrl + '/sharing/rest/community/users/' + param.user.username //portal123
      esriRequest(url, {
          query: {
            f: 'json',
            token: param.user.token
          }
        }).then(lang.hitch(this, function (res) {
        if (instance.isUserhasSpatialAnalysis(res.data)) {
          dfd.resolve(true);
        } else {
          dfd.reject('没有空间分析权限');
        }

      }), function (err) {
        dfd.reject('判断用户权限失败');
      });
      return dfd;
    },

    createService(param) {

      console.log('正在创建服务')
      var dfd = new Deferred();
      var url = param.portalUrl + '/sharing/rest/content/users/' + param.user.username + '/createService';

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
        "name": param.param.exportService.name
      }
      var queryParam = {
        createParameters: JSON.stringify(createParameters),
        outputType: 'featureService',
        f: 'json',
        token: param.user.token
      }

      esriRequest(url, {
          query: queryParam,
          method: 'post'
        }).then(lang.hitch(this, function (res) {

        var item = {
          id: res.data.itemId,
          url: res.data.serviceurl,
          origin: res.data
        }

        console.log('创建服务成功，itemId:' + item.id)

        dfd.resolve(item);
      }), function (err) {
        console.log(err)
        dfd.reject('创建服务失败:' + err);
      });

      return dfd;
    },

    validCreateService(param) {
      var dfd = new Deferred();
      param._validCreateService_times++;
      //验证超过10次则，判断为验证不成功
      if (param._validCreateService_times > 10) {
        throw new Error('输出图层创建，验证超时');
      }

      var url = param.portalUrl + '/sharing/rest/content/users/' + param.user.username + '/items/' + param.portalItem.id;
      var queryParam = {
        f: 'json',
        token: param.user.token
      }
      esriRequest(url, {query: queryParam}).then(lang.hitch(this, function (res) {
        if (res.data.item.id === param.portalItem.id && res.data.sharing) {
          dfd.resolve()
        } else {
          //如果还未创建则再次验证
          setTimeout(lang.hitch(this, function () {
            instance.validCreateService();
          }), 500)
        }
      }), function (err) {
        dfd.reject(err);
      });
      return dfd;
    },

    /**
     * @param jobId gp执行的id
     * @param analyzeService 空间分析地址
     * @param analyzeToolName 空间分析工具的名称
    */
    watchJob(param) {
      if (!param.jobId) {
        throw new Error('jobId 不能为null');
      }
      if (!param.analyzeToolName) {
        throw new Error('analyzeToolName[空间分析工具的名称] 不能为null')
      }

      var event = new Evented();

      var url = param.analyzeService + '/' + param.analyzeToolName + '/jobs/' + param.jobId;

      var queryParam = {
        f: 'json',
        token: param.user.token
      }

      console.log('watchUrl:' + url);

      var interval = setInterval(function () {
        esriRequest(url, {
            query: queryParam,
            method: 'post'
          })
          .then(lang.hitch(this, function (res) {

            if (res.data.jobStatus === 'esriJobFailed') {

              window.clearInterval(interval);

              event.emit('error', res.data);
            } else if (res.data.jobStatus === 'esriJobSucceeded') {

              window.clearInterval(interval);

              event.emit('success', res.data);
            } else {
              event.emit('msg', res.data);
            }

          }), function (err) {
            //若有错误则销毁interval
            window.clearInterval(interval)
            event.emit('internet-error', err);
            console.log(err);
          });
      }, 2000)

      return event;
    },
    //删除创建的图层
    removeServicefromPortal: function (param) {

      var dfd = new Deferred();

      if (param.portalItem && param.portalItem.id) {

        var url = param.portalUrl + '/sharing/rest/content/users/' + param.user.username + '/items/' + param.portalItem.id + '/delete'
        esriRequest(url, {
          query: {
            token: param.user.token,
            f: 'json'
          },
            method: 'post'
          })
          .then(lang.hitch(this, function (res) {
            if (res.data.success) {
              dfd.resolve(res.data);
            } else {
              dfd.reject(res.data);
            }
          }), function (err) {
            dfd.reject(err);
          })

        return dfd;
      } else {
        throw new Error('itemId is null');
      }

    },

    /**
     * 注意:
     * 1 如果 图层中有多个子图层，会将图层拆分后，获取每个子图层的信息
     * 2 结果会以图层Url作为标识字段
     *
    */
    getCurrentDisplayLayerWithInfo(param) {
      var dfd = new Deferred();
      //获取服务
      var services = ArrayUtil.filter(param.mapView.map.allLayers.items, function (v) {
        //排除底图
        var isBaseMap = ArrayUtil.some(param.mapView.map.basemap.baseLayers.items, function (vv) {
          return vv.id === v.id
        });
        //只针对加载的服务
        if (v.url && !isBaseMap) {
          //如果mapServer只有一个图层，则按照featureLayer来处理
          return true;
        }
      });

      var splitServices = [];
      ArrayUtil.filter(services, function (v) {
        if (v.type === 'feature') {
          splitServices.push({
            url: v.source.url + '/' + v.source.layerId,
            info: v.source.layerDefinition
          })
        } else if (v.sublayers && v.sublayers.items) {
          ArrayUtil
            .forEach(v.sublayers.items, function (vv) {
              splitServices.push({url: vv.url, parentName: v.title})

            });
        } else {
          splitServices.push({url: v.url})
        }
      });

      var promises = ArrayUtil.map(splitServices, function (v, k) {
        return instance.getLayerInfo(v.url, param.user.token);
      });

      all(promises).then(function (resArr) {
        ArrayUtil
          .forEach(resArr, function (v, k) {
            splitServices[k].info = v;
            var parentName = splitServices[k].parentName;
            splitServices[k].name = parentName
              ? parentName + '-' + v.name
              : v.name
            // filterServices.push({layer: services[k], info: v});

          });

        dfd.resolve(splitServices);

      });

      return dfd;
    },

    getPortalInfo(param) {
      var dfd = new Deferred();
      var portalUrl = param.portalUrl;
      var token = param.token;

      var url = portalUrl + '/sharing/rest/portals/self'

      esriRequest(url, {
          query: {
            f: 'json',
            token: token,
            culture: 'zh-cn'
          }
        }).then(lang.hitch(this, function (res) {
        instance.portalInfo = res.data;
        dfd.resolve(res.data)
      }), function (err) {
        dfd.reject('无法获取portal元数据');
      });
      return dfd;
    }

  };

  return instance;
})