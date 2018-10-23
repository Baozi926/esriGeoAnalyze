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
        this.onAnalyzeStart();
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

        var extra = {}
        if (this.getParam('clusterArea')) {
          var layer = this
            .mapView
            .map
            .findLayerById(this.getParam('clusterArea'))
          if (this.getParam('analysisField')) {
            extra = {
              boundingPolygonLayer: {
                url: layer.url
              }
            }

          } else {
            extra = {
              aggregationPolygonLayer: {
                url: layer.url
              }
            }
          }
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
          }, extra)
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

          }
          this.onAnalyzeEnd(res);
        }), lang.hitch(this, function (err) {
          this.onAnalyzeEnd();
          alert(err);
        }))
      }
    },
    data: {
      availableServices: null,
      inputLayer: null
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

      var layerUrl = evt.target.value;

      this.setParam('inputLayer', layerUrl);

      //重置analysisField
      this.setParam('analysisField', '');

      //设置第二步骤的可选参数
      var avaliableFields = [];

      var layer = ArrayUtil.filter(this.data.availableServices, function (v) {
        return v.url === layerUrl;
      }, this)[0];

      this.data.inputLayer = layer;

      var info = layer.info

      var fields = info.fields;

      ArrayUtil.forEach(fields, function (v) {
        if (arcgisUtil.isNumberFieldType(v.type)) {
          avaliableFields.push(v);
        }
      }, this);

      domConstruct.empty(this.clusterAttrNode);

      if (arcgisUtil.isPointLayer(info.geometryType)) {
        domConstruct.create('option', {
          selected: true,
          value: '',
          innerHTML: '点计数'
        }, this.clusterAttrNode)
      } else {
        domConstruct.create('option', {
          selected: true,
          disabled: true,
          hidden: true,
          innerHTML: '请选择'
        }, this.clusterAttrNode)
      }

      //创建字段选择option
      ArrayUtil
        .forEach(avaliableFields, function (v) {
          domConstruct.create('option', {
            innerHTML: v.alias,
            value: v.name
          }, this.clusterAttrNode);
        }, this)

      this.clusterAttrChange({target: this.clusterAttrNode})

    },

    onDividedFieldChange(evt) {

      var value = evt.target.value;
      this.setParam('divideByField', value)

    },

    getDividedFields() {

      var srcNode = this.dividedFieldsNode;
      domConstruct.empty(srcNode);

      var layer = this.data.inputLayer;

      if (!layer) {
        return;
      }

      var info = layer.info;

      var fields = info.fields;

      var avaliableFields = [];

      ArrayUtil.forEach(fields, function (v) {
        if (arcgisUtil.isNumberFieldType(v.type)) {
          avaliableFields.push(v);
        }
      }, this);

      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, srcNode);

      //如果是按属性计算则可以有被除属性
      if (this.getParam('analysisField')) {
        ArrayUtil
          .forEach(avaliableFields, function (v) {
            domConstruct.create('option', {
              innerHTML: v.alias,
              value: v.name
            }, srcNode);
          }, this)
      } else {
        domConstruct.create('option', {
          value: '',
          innerHTML: '无'
        }, srcNode);
      }
    },

    clusterAreaChange(evt) {
      var value = evt.target.value;
      this.setParam('clusterArea', value);

    },

    clusterAttrChange(evt) {

      this.setParam('analysisField', evt.target.value)

      if (this.getParam('analysisField')) {
        domClass.add(this.clusterAttrSubAttrNode, 'hide');
        this.setParam('shapeType', '');
        this.setParam('clusterArea', '');
      } else {
        domClass.remove(this.clusterAttrSubAttrNode, 'hide');
      }
      this.setParam('divideByField', null);

      this.getDividedFields();
    },
    getAvailableLayers() {
      domConstruct.empty(this.layerChooseNode);

      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.layerChooseNode);

      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.clusterAreaNode);

      domConstruct.create('option', {
        value: '',
        innerHTML: '无'
      }, this.clusterAreaNode)

      arcgisUtil
        .getCurrentDisplayLayerWithInfo({mapView: this.mapView, user: this.user})
        .then(lang.hitch(this, function (res) {

          var hasService = false;
          this.data.availableServices = res;
          //为过滤后的结果生成dom
          ArrayUtil.forEach(res, function (v) {
            domConstruct.create('option', {
              value: v.url,
              innerHTML: v.name
            }, this.layerChooseNode)
          }, this);

          ArrayUtil.forEach(res, function (v) {
            if (!arcgisUtil.isPointLayer(v.info.geometryType)) {
              hasService = true
              domConstruct.create('option', {
                value: v.url,
                innerHTML: v.name
              }, this.clusterAreaNode)
            }
          }, this);

          if (!hasService) {
             this.onNoServiceAvailable();
          }

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

      domConstruct.create('option', {
        value: this.user.username,
        innerHTML: this.user.username
      }, this.resultFolderNode);

      ArrayUtil.forEach(this.user.info.folders, function (v) {
        domConstruct.create('option', {
          value: v.id,
          innerHTML: v.title
        }, this.resultFolderNode)
      }, this);

    },
    initParams: function () {
      var that = this;

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
                    //如果按照属性计算，就不需要
                    if (that.getParam('analysisField')) {
                      return true
                    } else {
                      return value != null && value != ''
                    }

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
            },
            clusterArea: {}
          }
        }, {
          srcNode: this.step_3_node,
          name: '步骤三',
          params: {
            divideByField: {}
          }
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