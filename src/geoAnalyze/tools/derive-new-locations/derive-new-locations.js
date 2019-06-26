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
  './derive-new-locations-task', //此处需修改成自己的task
  '../../ui/layer-relation-generator/layer-relation-generator'

], function (FeatureLayer, geoAnaConfig, ArrayUtil, domConstruct, lang, domClass, domStyle, esriConfig, esriRequest, _WidgetBase, _TemplatedMixin, declare, template, arrayUtil, arcgisUtil, ToolBase, DeriveNewLocationsTask, LayerRelationGenerator) {
  var widget = declare([
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
      this.useCurrentExtentChange({target: this.useCurrentExtent_Node});
      this.ui.layerRelationGenerator = new LayerRelationGenerator({}, domConstruct.create('div', {}, this.inputLayersNode));
      this.getAvailableLayers();
    },
    runTask() {

      var gpParam = this
        .ui
        .layerRelationGenerator
        .getQueryParam4deriveNewLocations();

      this.setParam('inputLayers', gpParam.inputLayers);
      this.setParam('expressions', gpParam.expressions);

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

        var dfd = new DeriveNewLocationsTask().run({
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

          }
          this.onAnalyzeEnd(res);
        }), lang.hitch(this, function (err) {
          this.onAnalyzeEnd();
          alert(err);
        }))
      }
    },
    ui: {},
    data: {
      avaliableServices: []
    },
    getAvailableLayers() {
      arcgisUtil
        .getCurrentDisplayLayerWithInfo({mapView: this.mapView, user: this.user})
        .then(lang.hitch(this, function (services) {
          if (services.length === 0) {
            this.onNoServiceAvailable();
          }
          this.avaliableServices = services;
          this
            .ui
            .layerRelationGenerator
            .setLayers(services);
        }))
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

      return [
        {
          name: '步骤一',
          srcNode: this.step_1_node,
          params: {
            inputLayers: {
              value: null,
              rule: [
                {
                  msg: '不能为空',
                  valid: function (value) {
                    return value != null && value != ''
                  }
                }
              ]
            },
            expressions: {
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