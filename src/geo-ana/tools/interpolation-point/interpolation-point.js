
/**
 * @author caihm 
 * @createDate 2018-9-3
 * 
*/

define([
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
  '../ToolBase'
], function (ArrayUtil, all, domConstruct, lang, domClass, domStyle, esriConfig, esriRequest, _WidgetBase, _TemplatedMixin, declare, template, arrayUtil, interpolationPointTask, arcgisUtil, ToolBase) {
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
        debugger
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
          },
          analyzeToolName: 'InterpolatePoints'
        });

        dfd.then(lang.hitch(this, function (res) {
          if (res.success) {
            //将结果图层加载到地图
            var serviceUrl = res.serviceUrl;
            console.log('结果图层url:' + serviceUrl);
            this
              .mapView
              .map
              .add(new FeatureLayer({
                url: serviceUrl + '?token=' + this.user.token
              }));

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
              innerHTML: v.name
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

      this.setParam('inputLayer', value)

      var avaliableFields = [];

      var info = this.getServicesInfo({id: layerId});

      var fields = info.fields;

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
      var services = ArrayUtil.filter(this.mapView.map.allLayers.items, function (v) {
        //排除底图
        var isBaseMap = ArrayUtil.some(this.mapView.map.basemap.baseLayers.items, function (vv) {
          return vv.id === v.id
        }, this);
        //只针对加载的服务
        if (v.url && !isBaseMap) {
          //如果mapServer只有一个图层，则按照featureLayer来处理
          if (v.sublayers) {
            return v.sublayers.items.length === 1
          } else {
            return true
          }

        }
      }, this);

      domConstruct.empty(this.layerChooseNode);

      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.layerChooseNode);

      var filterServices = []

      var promises = ArrayUtil.map(services, function (v, k) {
        var url;
        if (v.sublayers && v.sublayers.items.length === 1) {
          url = v.url + '/0';
        } else {
          url = v.url
        }
        return arcgisUtil.getLayerInfo(url, this.user.token);
      }, this);

      all(promises).then(lang.hitch(this, function (resArr) {
        this.currentServicesInfo = [];

        ArrayUtil.forEach(resArr, function (v, k) {
          if (v.geometryType == 'esriGeometryPoint') {
            filterServices.push(services[k]);

            this
              .currentServicesInfo
              .push({layer: services[k], info: v})
          }
        }, this);

        //为过滤后的结果生成dom
        ArrayUtil.forEach(filterServices, function (v) {
          domConstruct.create('option', {
            value: v.id,
            innerHTML: v.title
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