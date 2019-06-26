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
  './DemoTask' //此处需修改成自己的task
], function (FeatureLayer, geoAnaConfig, ArrayUtil, domConstruct, lang, domClass, domStyle, esriConfig, esriRequest, _WidgetBase, _TemplatedMixin, declare, template, arrayUtil, arcgisUtil, ToolBase, DemoTask) {
  var widget = declare('caihm.widgets.Buffer', [
    _WidgetBase, _TemplatedMixin, ToolBase
  ], {
    toolName: 'demo分析',
    templateString: template,
    constructor(options) {

      this.mapView = options.mapView;
      this.portalUrl = options.portalUrl;
      this.user = options.user;
      this.analyzeService = options.analyzeService;
      this.portalInfo = options.portalInfo;
    },

    postCreate() {
      //运行父类的postCreate函数
      this.inherited(arguments);
    },
    startup() {
      this.initFolders();
      this.useCurrentExtentChange({target: this.useCurrentExtent_Node});
      this.getAvailableLayers();
    },
    runTask() {
      var state = {
        valid: true
      } || this.checkParam();
      if (state.valid) {
        this.onAnalyzeStart();
        setTimeout(lang.hitch(this, function () {
          this.onAnalyzeEnd({success: false})
        }), 3000);
      }
    },
    getAvailableLayers() {},
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
        domConstruct.create('option', {
          value: this.user.username,
          innerHTML: this.user.username
        }, this.resultFolderNode);
        
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
          name: '步骤二',
          params: {},
          srcNode: this.step_2_node
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