/**
 * @author caihm
 * @createDate 2018-9-3
 *
*/

define([
  "esri/layers/FeatureLayer",
  'dojo/_base/array',
  'dojo/promise/all',
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
  './interpolation-point-task',
  '../../arcgisUtil',
  '../ToolBase',
  '../../config'
], function (FeatureLayer, ArrayUtil, all, domConstruct, lang, domClass, domStyle, esriConfig, esriRequest, _WidgetBase, _TemplatedMixin, declare, template, arrayUtil, interpolationPointTask, arcgisUtil, ToolBase, geoAnaConfig) {
  var widget = declare('caihm.widgets.interpolation-point', [
    _WidgetBase, _TemplatedMixin, ToolBase
  ], {
    constructor(options) {

      this.mapView = options.mapView;
      this.portalUrl = options.portalUrl;
      this.user = options.user;
      this.analyzeService = options.analyzeService;
      this.portalInfo = options.portalInfo;
    },

    templateString: template,

    data: {
      currentServicesInfo: []
    },

    startup() {
      this.getAvailableLayer();
      this.initFolders();
      this.useCurrentExtentChange({target: this.useCurrentExtent_Node});
    },
    runTask() {
      var state = this.checkParam();
      if (state.valid) {
        this.onAnalyzeStart();
        var tempParm = this.getTransParam();
        var context;

        if (tempParm.use_current_extent) {
          context = {
            "extent": {
              "type": "extent"
            }
          }
          lang.mixin(context.extent, this.mapView.extent.toJSON())
        }

        var dfd = new interpolationPointTask().run({
          portalInfo: this.portalInfo,
          analyzeService: this.analyzeService,
          user: this.user,
          portalUrl: this.portalUrl,
          param: {
            inputLayer: tempParm.inputLayer,
            exportService: {
              name: tempParm.result_layer_name
            },
            field: tempParm.field,
            folderId: tempParm.folderId,
            context: context
          }
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
            this.onAnalyzeEnd();
          } else {
            alert('失败')
          }
        }), lang.hitch(this, function (err) {
          alert(err);
        }))
      }
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

    resultNameChange: function (evt) {
      this.setParam('result_layer_name', evt.target.value)
    },
    resultFolderChange: function (evt) {
      this.setParam('folderId', evt.target.value)
    },
    choosenFieldChange(evt) {
      this.setParam('field', evt.target.value)

    },

    inputLayerChange(evt) {
      var layerUrl = evt.target.value;
      

      this.setParam('inputLayer', layerUrl)

      var avaliableFields = [];

      var layer = ArrayUtil.filter(this.data.availableServices, function (v) {
        return v.url === layerUrl;
      }, this)[0];


      var fields = layer.info.fields;

      ArrayUtil.forEach(fields, function (v) {
        if (arcgisUtil.isNumberFieldType(v.type)) {
          avaliableFields.push(v);
        }
      }, this);

      domConstruct.empty(this.fieldChooseNode);

      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.fieldChooseNode)
      //创建字段选择option
      ArrayUtil.forEach(avaliableFields, function (v) {
        domConstruct.create('option', {
          innerHTML: v.alias,
          value: v.name
        }, this.fieldChooseNode);
      }, this)

    },

    getServicesInfo(layer) {
      var filter = ArrayUtil.filter(this.currentServicesInfo, function (v) {
        return layer.id === v.layer.id;
      }, this);

      if (filter.length === 1) {
        return filter[0].info
      }

    },

    getAvailableLayer() {

      //获取服务
      var services = arcgisUtil
        .getCurrentDisplayLayerWithInfo({mapView: this.mapView, user: this.user})
        .then(lang.hitch(this, function (res) {

          this.data.availableServices = ArrayUtil.filter(res, function (v) {
            return v.info.geometryType === 'esriGeometryPoint'
          }, this);

          domConstruct.empty(this.layerChooseNode);

          domConstruct.create('option', {
            selected: true,
            disabled: true,
            hidden: true,
            innerHTML: '请选择'
          }, this.layerChooseNode);

          ArrayUtil.forEach(this.data.availableServices, function (v) {
            domConstruct.create('option', {
              value: v.url,
              innerHTML: v.name
            }, this.layerChooseNode)
          }, this);
        }));

    },

    initParams: function () {

      return [
        {
          srcNode: this.step_1_node,
          name: '步骤一',
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
          srcNode: this.step_2_node,
          name: '步骤二',
          params: {
            field: {
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
          srcNode: this.step_3_node,
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