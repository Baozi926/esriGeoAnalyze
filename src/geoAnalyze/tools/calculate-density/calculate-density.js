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
  './calculate-density-task' //此处需修改成自己的task
], function (FeatureLayer, geoAnaConfig, ArrayUtil, domConstruct, lang, domClass, domStyle, esriConfig, esriRequest, _WidgetBase, _TemplatedMixin, declare, template, arrayUtil, arcgisUtil, ToolBase, CalculateDensityTask) {
  var widget = declare('caihm.widgets.Buffer', [
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

    data: {},
    startup() {
      this.initFolders();
      this.useCurrentExtentChange({target: this.useCurrentExtent_Node});
      this.getAvailableLayers();
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

        var dfd = new CalculateDensityTask().run({
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

          var hasService = false

          ArrayUtil.forEach(res, function (v) {
            if (arcgisUtil.isPointLayer(v.info.geometryType) || arcgisUtil.isPolylineLayer(v.info.geometryType)) {
              hasService = true;
              domConstruct.create('option', {
                value: v.url,
                innerHTML: v.name
              }, this.layerChooseNode)
            }
          }, this);

          if (!hasService) {
             this.onNoServiceAvailable();
          }

        }));
    },
    fieldChange(evt) {
      this.setParam('field', evt.target.value)
    },
    inputLayerChange(evt) {
      var layerUrl = evt.target.value;

      this.setParam('inputLayer', layerUrl);
      this.setParam('field', '');

      var layer = ArrayUtil.filter(this.data.availableServices, function (v) {
        return v.url === layerUrl;
      }, this)[0];

      this.data.inputLayer = layer;

      var info = layer.info

      var fields = info.fields;
      var avaliableFields = [];

      ArrayUtil.forEach(fields, function (v) {
        if (arcgisUtil.isNumberFieldType(v.type)) {
          avaliableFields.push(v);
        }
      }, this);

      domConstruct.empty(this.fieldNode);

      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.fieldNode);

      domConstruct.create('option', {
        value: '',
        innerHTML: '无'
      }, this.fieldNode)

      ArrayUtil.forEach(avaliableFields, function (v) {
        domConstruct.create('option', {
          innerHTML: v.alias,
          value: v.name
        }, this.fieldNode);
      }, this)

    },
    fieldChange() {},
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
      }, this.resultFolderNode)

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
          srcNode: this.step_2_node,
          params: {
            field: {}
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