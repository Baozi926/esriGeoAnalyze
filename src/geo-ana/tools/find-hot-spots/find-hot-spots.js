define([
  "esri/layers/FeatureLayer",
  '../../config',
  'dojo/_base/array',
  'dojo/dom-construct',
  'dojo/_base/lang',
  'dojo/dom-class',
  'dojo/dom-style',
  "esri/config",
  'esri/request',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/_base/declare',
  'dojo/text!./template.html',
  'dojo/_base/array',
  '../../arcgisUtil',
  '../ToolBase',
  './find-hot-spots-task' //此处需修改成自己的task
], function (FeatureLayer, geoAnaConfig, ArrayUtil, domConstruct, lang, domClass, domStyle, esriConfig, esriRequest, _WidgetBase, _TemplatedMixin, declare, template, arrayUtil, arcgisUtil, ToolBase, findHotSpotsTask) {
  var widget = declare('caihm.widgets.findHotSpots', [
    _WidgetBase, _TemplatedMixin, ToolBase
  ], {
    templateString: template,
    constructor(options) {

      this.mapView = options.mapView;
      this.portalUrl = options.portalUrl;
      this.user = options.user;
      this.analyzeService = options.analyzeService;
      this.portalInfo = options.portalInfo;
    },
    startup() {
      this.initFolders();
      this.getAvailableLayers();
      this.getShapeType(this.clusterShapeTypeNode);

      this.useCurrentExtentChange({target: this.useCurrentExtent_Node});
    },
    runTask() {

      var state = this.checkParam();
      if (state.valid) {

        var tempParm = this.getTransParam();
        var context = '';

        if (tempParm.use_current_extent) {
          context = {
            "extent": {
              "type": "extent"
            }
          }
          lang.mixin(context.extent, this.mapView.extent.toJSON())
        }

        var dfd = new findHotSpotsTask().run({
          portalInfo: this.portalInfo,
          analyzeService: this.analyzeService,
          user: this.user,
          portalUrl: this.portalUrl,
          param: lang.mixin(tempParm, {
            exportService: {
              name: tempParm.result_layer_name
            },
            context: context
          })
        });

        dfd.then(lang.hitch(this, function (res) {
          if (res.success) {
            //将结果图层加载到地图
            var serviceUrl = res.serviceUrl;
            if (geoAnaConfig.forceHttps) {
              serviceUrl = arcgisUtil.forceUrlToHttps(serviceUrl);
            }
            console.log('结果图层url:' + serviceUrl);
            this
              .mapView
              .map
              .add(new FeatureLayer({url: serviceUrl, token: this.user.token}));

          } else {
            alert('失败')
          }
        }), lang.hitch(this, function (err) {
          alert(err);
        }))
      }
    },
    data: {
      availableServices: null
    },

    getShapeType(srcNode) {
      domConstruct.empty(srcNode);
      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, srcNode);

      var defaultShapeTypes = [
        {
          name: '渔网网格',
          value: 'Fishnet'
        }, {
          name: '六边形网格',
          value: 'Hexagon'
        }
      ];
      ArrayUtil.forEach(defaultShapeTypes, function (v) {
        domConstruct.create('option', {
          innerHTML: v.name,
          value: v.value
        }, srcNode);
      }, this);

    },

    shapeTypeChange(evt) {
      this.setParam('shapeType', evt.target.value);

    },
    inputLayerChange(evt) {

      var layerId = evt.target.value;
      var layer = this
        .mapView
        .map
        .findLayerById(layerId);
      var value;

      if (layer.sublayers && layer.sublayers.items.length === 1) {
        value = layer.url + '/0';
      } else {
        value = layer.url;
      }

      this.setParam('inputLayer', value);

      //设置第二步骤的可选参数
      var avaliableFields = [];

      var info = ArrayUtil.filter(this.data.availableServices, function (v) {
        return v.layer.id === layerId;
      }, this)[0].info;

      var fields = info.fields;

      ArrayUtil.forEach(fields, function (v) {
        if (arcgisUtil.isNumberFieldType(v.type)) {
          avaliableFields.push(v);
        }
      }, this);

      domConstruct.empty(this.clusterAttrNode);

      domConstruct.create('option', {
        selected: true,
        innerHTML: '点计数'
      }, this.clusterAttrNode)

      //创建字段选择option
      ArrayUtil.forEach(avaliableFields, function (v) {
        domConstruct.create('option', {
          innerHTML: v.alias,
          value: v.name
        }, this.clusterAttrNode);
      }, this)
    },

    clusterAttrChange(evt) {

      this.setParam('analysisField', evt.target.value)
    },
    getAvailableLayers() {
      domConstruct.empty(this.layerChooseNode);

      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.layerChooseNode);

      arcgisUtil
        .getCurrentDisplayPointLayer({mapView: this.mapView, user: this.user})
        .then(lang.hitch(this, function (res) {
          this.data.availableServices = res;
          //为过滤后的结果生成dom
          ArrayUtil.forEach(res, function (v) {
            domConstruct.create('option', {
              value: v.layer.id,
              innerHTML: v.layer.title
            }, this.layerChooseNode)
          }, this);
        }));
    },
    resultNameChange: function (evt) {
      this.setParam('result_layer_name', evt.target.value)
    },
    resultFolderChange: function (evt) {
      this.setParam('folderId', evt.target.value)
    },
    useCurrentExtentChange: function (evt) {
      this.setParam('use_current_extent', evt.target.checked)
    },
    initFolders() {

      domConstruct.empty(this.resultFolderNode);
      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.resultFolderNode);

      if (this.user.info.folders.length === 0) {
        domConstruct.create('option', {
          value: this.user.username,
          innerHTML: this.user.username
        }, this.resultFolderNode)
      } else {
        ArrayUtil
          .forEach(this.user.info.folders, function (v) {
            domConstruct.create('option', {
              value: v.id,
              innerHTML: v.title
            }, this.resultFolderNode)
          }, this);
      }

    },
    initParams: function () {

      return [
        {
          name: '步骤一',
          srcNode: this.step_1_node,
          params: {
            inputLayer: {
              value: null,
              rule: [
                {
                  msg: '不能为空',
                  valid: function (value) {
                    return value != null && value != ''
                  }
                }
              ]
            }
          }
        }, {
          name: '步骤二', //

          srcNode: this.step_2_node,
          params: {
            shapeType: {
              rule: [
                {
                  msg: '不能为空',
                  valid: function (value) {
                    return value != null && value != ''
                  }
                }
              ]
            },
            analysisField: {
              value: null,
              rule: [
                {
                  msg: '',
                  valid: function (value) {
                    return true
                  }
                }
              ]
            }
          }
        }, {
          srcNode: this.step_3_node,
          name: '步骤三',
          params: {}
        }, {
          srcNode: this.step_4_node,
          name: '步骤三',
          params: {
            use_current_extent: {},
            result_layer_name: {
              rule: [
                {
                  msg: '不能为空',
                  valid: function (value) {
                    return value != null && value != ''
                  }
                }
              ]
            },
            folderId: {
              rule: [
                {
                  msg: '不能为空',
                  valid: function (value) {
                    return value != null && value != ''
                  }
                }
              ]
            }
          }
        }
      ]
    }
  });

  return widget;

})