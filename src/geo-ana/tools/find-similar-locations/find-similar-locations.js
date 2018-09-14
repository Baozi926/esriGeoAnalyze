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
  './find-similar-locations-task' //此处需修改成自己的task
], function (FeatureLayer, geoAnaConfig, ArrayUtil, domConstruct, lang, domClass, domStyle, esriConfig, esriRequest, _WidgetBase, _TemplatedMixin, declare, template, arrayUtil, arcgisUtil, ToolBase, findSimilarLocationsTask) {
  var widget = declare('caihm.widgets.find-similar-locations', [
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
    data:{},

    startup() {
      this.initFolders();
      this.getAvailableLayers();
      this.useCurrentExtentChange({target: this.useCurrentExtent_Node});
    },
    runTask() {
      var state = this.checkParam();
      if (state.valid) {}
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
        .getCurrentDisplayLayerWithInfo({mapView: this.mapView, user: this.user})
        .then(lang.hitch(this, function (res) {

          this.data.availableServices = res;

          ArrayUtil.forEach(res, function (v) {
            if (arcgisUtil.isPointLayer(v.info.geometryType)) {
              domConstruct.create('option', {
                value: v.url,
                innerHTML: v.name
              }, this.layerChooseNode);
            }
          }, this);

        }));

    },
    inputLayerChange() {},

    resultNameChange: function (evt) {
      this.setParam('result_layer_name', evt.target.value)
    },
    resultFolderChange: function (evt) {
      this.setParam('result_folder', evt.target.value)
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
          srcNode: null,
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
          name: '步骤二',
          params: {},
          srcNode: null
        }, {
          srcNode: this.stepNode_3,
          name: '步骤二',
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
            result_folder: {
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