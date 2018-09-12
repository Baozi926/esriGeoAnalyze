/**
 * @author caihm
 * @createDate 2018-9-3
 *
 *
*/
define([
  'esri/identity/IdentityManager',
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
  "esri/layers/FeatureLayer",
  './BufferTask',
  '../ToolBase',
  '../../arcgisUtil',
  '../../config'
], function (IdentityManager, domConstruct, lang, domClass, domStyle, esriConfig, esriRequest, _WidgetBase, _TemplatedMixin, declare, template, ArrayUtil, FeatureLayer, BufferTask, ToolBase, arcgisUtil, geoAnaConfig) {
  var widget = declare('caihm.widgets.Buffer', [
    _WidgetBase, _TemplatedMixin, ToolBase
  ], {
    templateString: template,
    constructor: function (options, srcNode) {
      this.mapView = options.mapView;
      this.portalUrl = options.portalUrl;

      this.user = options.user;
      this.analyzeService = options.analyzeService;

      if (false) {
        // IdentityManager.registerToken({userId: this.user.username, token:
        // this.user.token, server: 'https://map.xyzhgt.com/arcgis/rest/'});
        this
          .mapView
          .map
          .add(new FeatureLayer({
            token: 'z-lSS4vyY6QdE-6Es4r_0iWElyRhSlhXh9DYJB7VBzPONmd7XY84vh5nG-XE1h1h-xShTu26wVGRO2MA' +
                'zkY-LPsQV6wfFTWwBmXsnCrMNQpQ_ijxMMY_7ie4bZDa8D7AZvcksA8HM06WCixjjRw5dg..' || this.user.token,
            url: 'https://gis020082.xyzhgt.com/arcgis/rest/services/Hosted/ceshi_shuxing/FeatureSe' +
                'rver'
          }));

      }
    },
    //当前步骤
    currentStep: 0,
    //步骤总数
    postCreate: function () {
      this.inherited(arguments);
      //默认为距离类型的buffer计算
      this.select_buffer_type_distance();
      this.buffer_options_ChangeOverlap();
      //根据template中checkbox的状态修改参数
      this.useCurrentExtentChange({target: this.useCurrentExtent_Node});
      this.getAvailableLayers();
      this.initDisatanceUnits();
      this.initFolders();
      this.onAnalyzeStart();
      this.onAnalyzeEnd();
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

    initDisatanceUnits() {

      domConstruct.empty(this.distanceUnitNode);
      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.distanceUnitNode);

      ArrayUtil.forEach(arcgisUtil.numberUnits, function (v) {
        domConstruct.create('option', {
          value: v.value,
          innerHTML: v.name
        }, this.distanceUnitNode)
      }, this);

      domConstruct.empty(this.distanceUnitNode2);
      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.distanceUnitNode2);

      ArrayUtil.forEach(arcgisUtil.numberUnits, function (v) {
        domConstruct.create('option', {
          value: v.value,
          innerHTML: v.name
        }, this.distanceUnitNode2)
      }, this);
    },

    //获取可操作的图层
    getAvailableLayers: function () {
      domConstruct.empty(this.layerChooseNode);

      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.layerChooseNode)

      ArrayUtil.forEach(this.mapView.map.allLayers.items, function (v) {
        //排除底图
        var isBaseMap = ArrayUtil.some(this.mapView.map.basemap.baseLayers.items, function (vv) {
          return vv.id === v.id

        }, this);

        //只针对加载的服务
        if (v.url && !isBaseMap) {
          //针对通过MapImageLayer加进来的只有一个图层的情况
          if (v.sublayers) {
            if (v.sublayers.items.length === 1) {
              domConstruct.create('option', {
                value: v.id,
                innerHTML: v.title
              }, this.layerChooseNode)
            }

          } else {
            domConstruct.create('option', {
              value: v.id,
              innerHTML: v.title
            }, this.layerChooseNode)
          }

        }

      }, this);

    },
    buffer_options_ChangeOverlap: function () {
      this.setParam('buffer_option', 'None')
      domClass.remove(this.buffer_options_dissolve_Node, 'active')

      domClass.add(this.buffer_options_overlap_Node, 'active')
    },
    buffer_options_ChangeDissolve: function () {
      this.setParam('buffer_option', 'Dissolve')
      domClass.add(this.buffer_options_dissolve_Node, 'active')
      domClass.remove(this.buffer_options_overlap_Node, 'active')
    },

    switch_buffer_options: function (evt) {
      if (domStyle.get(this.buffer_options_Node, 'display') == 'none') {
        domStyle.set(this.buffer_options_Node, 'display', 'block')
        domClass.add(evt.target, 'expand')
      } else {
        domStyle.set(this.buffer_options_Node, 'display', 'none')
        domClass.remove(evt.target, 'expand')
      }

    },
    fieldChange: function (evt) {
      this.setParam('buffer_field', evt.target.value)
    },
    resultNameChange: function (evt) {
      this.setParam('result_layer_name', evt.target.value)
    },
    resultFolderChange: function (evt) {
      this.setParam('result_folder', evt.target.value)
    },

    select_buffer_type_distance: function (evt) {
      domStyle.set(this.buffer_type_distance_Node, 'display', 'block')
      domStyle.set(this.buffer_type_field_Node, 'display', 'none')
      domClass.add(this.buffer_type_distance_switch_Node, 'active')
      domClass.remove(this.buffer_type_field_switch_Node, 'active')

      this.setParam('buffer_type', 'distance')
    },
    select_buffer_type_field: function (evt) {
      domStyle.set(this.buffer_type_distance_Node, 'display', 'none')
      domStyle.set(this.buffer_type_field_Node, 'display', 'block')
      domClass.remove(this.buffer_type_distance_switch_Node, 'active')
      domClass.add(this.buffer_type_field_switch_Node, 'active')
      this.setParam('buffer_type', 'field')
    },

    inputLayerChange: function (evt) {

      var layerId = evt.target.value;
      var layer = this
        .mapView
        .map
        .findLayerById(layerId);
      var value
      if (layer.sublayers && layer.sublayers.items.length === 1) {
        value = layer.url + '/0';
      } else {
        value = layer.url;
      }
      arcgisUtil
        .getLayerInfo(value, this.user.token)
        .then(lang.hitch(this, function (res) {
          var fields = res.fields;

          var avaliableFields = [];
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

        }));

      this.setParam('buffer_layer', value);

    },
    //缓冲区距离单位改变
    distanceUnitChange: function (evt) {
      //同步一下两个值，不是mvvm的锅。。。
      this.distanceUnitNode.value = evt.target.value;
      this.distanceUnitNode2.value = evt.target.value;
      this.setParam('buffer_distance_unit', evt.target.value)
    },
    //缓冲区距离改变
    distanceChange: function (evt) {
      this.setParam('buffer_distance', evt.target.value)
    },
    useCurrentExtentChange: function (evt) {
      this.setParam('use_current_extent', evt.target.checked)
    },

    //进行buffer操作
    _doBuffer: function (param) {
      this.onAnalyzeStart();
      var bufferTask = new BufferTask();
      var context = {}
      if (this.getParam('use_current_extent')) {
        context = {
          "extent": {
            "type": "extent"
          }
        }
        lang.mixin(context.extent, this.mapView.extent.toJSON())

      }

      bufferTask
        .setUser(this.user)
        .setAnalyzeService({url: this.analyzeService})
        .setPortalUrl({url: this.portalUrl})
        .run({
          token: this.token,
          inputLayer: this.getParam('buffer_layer'),
          distances: this.getParam('buffer_distance'),
          field: this.getParam('buffer_field'),
          units: this.getParam('buffer_distance_unit'),
          exportService: {
            name: this.getParam('result_layer_name')
          },
          dissolveType: this.getParam('buffer_option'),
          context: context,
          username: this.username,
          folderId: this.getParam('result_folder')
        })
        .then(lang.hitch(this, function (res) {

          if (res.success) {
            //将结果图层加载到地图
            var serviceUrl = res.serviceUrl;
            console.log('结果图层url:' + serviceUrl);
            if (geoAnaConfig.forceHttps) {

              serviceUrl = arcgisUtil.forceUrlToHttps(serviceUrl);
            }

            this
              .mapView
              .map
              .add(new FeatureLayer({url: serviceUrl, token: this.user.token}));
            this.onAnalyzeEnd();

          } else {
            alert('失败')
          }
        }), function (err) {
          alert(err, {delay: 7000});
        })

    },
    //开始buffer操作
    doBuffer: function () {
      var state = this.checkParam();
      if (state.valid) {
        this._doBuffer(this.getTransParam(this._params));

      }
    },

    initParams: function () {
      var that = this;
      return [
        {
          name: '步骤一',
          srcNode: this.stepNode_1,
          params: {
            buffer_layer: {
              value: null,

              rule: [
                {
                  msg: '请选择用于计算缓冲区的图层',
                  valid: function (value) {
                    return value != null && value != ''
                  }
                }
              ]
            }
          }

        }, {
          name: '步骤二',
          srcNode: this.stepNode_2,
          params: {
            buffer_type: {
              value: null,
              step: 2,
              rule: [
                {
                  msg: '',
                  valid: function (value) {
                    var _default = ['distance', 'field'];
                    return ArrayUtil.some(_default, function (v) {
                      return value == v
                    })
                  }
                }
              ]
            },
            buffer_option: {
              value: null,
              step: 2,
              rule: [
                {
                  msg: '',
                  valid: function (value) {
                    var _default = ['None', 'Dissolve'];
                    return ArrayUtil.some(_default, function (v) {
                      return value == v
                    })
                  }
                }
              ]
            },
            buffer_field: {
              value: null,
              step: 2,
              rule: [
                {
                  msg: '请选择计算缓冲区的对应字段',
                  valid: function (value) {
                    if (that.getParam('buffer_type') === 'distance') {
                      return true;
                    } else if (that.getParam('buffer_type') === 'field') {
                      return value != null && value != ''
                    } else {
                      return value != null && value != ''
                    }
                  }
                }
              ]
            },

            buffer_distance_unit: {
              value: null,
              step: 2,
              rule: [
                {
                  msg: '请选择计算单位',
                  valid: function (value) {
                    return value != null && value != ''
                  }
                }
              ]
            },
            buffer_distance: {
              value: null,
              step: 2,
              rule: [
                {
                  msg: '请输入缓冲区计算距离（例如：1 或 1 2 4 ）',
                  valid: function (value) {
                    if (that.getParam('buffer_type') === 'distance') {
                      return value != null && value != ''
                    } else if (that.getParam('buffer_type') === 'field') {
                      return true
                    } else {
                      return value != null && value != ''
                    }
                  }
                }
              ]
            }
          }

        }, {
          name: '步骤三',
          srcNode: this.stepNode_3,
          params: {
            result_layer_name: {
              value: null,
              step: 3,
              rule: [
                {
                  msg: '请输入结果图层的名称层',
                  valid: function (value) {
                    return value != null && value != ''
                  }
                }
              ]
            },
            result_folder: {
              value: null,
              step: 3,
              rule: [
                {
                  msg: '',
                  valid: function (value) {
                    return value != null && value != ''
                  }
                }
              ]
            },
            use_current_extent: {
              value: null
            }
          }

        }

      ]
    }
  });

  return widget;

})