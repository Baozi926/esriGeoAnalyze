define([
  'dojo/touch',
  'dojo/on',
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
  './find-similar-locations-task', //此处需修改成自己的task
  '../../ui/query-generator/query-generator'
], function (touch, on, FeatureLayer, geoAnaConfig, ArrayUtil, domConstruct, lang, domClass, domStyle, esriConfig, esriRequest, _WidgetBase, _TemplatedMixin, declare, template, arrayUtil, arcgisUtil, ToolBase, findSimilarLocationsTask, QueryQenerator) {
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
    ui: {},
    data: {
      inputLayer: null,
      searchLayer: null,
      availableServices: null,
      similarFields: {}
    },

    startup() {
      this.initFolders();
      this.getAvailableLayers();
      this.useCurrentExtentChange({target: this.useCurrentExtent_Node});
      this.ui.queryQenerator = new QueryQenerator({}, domConstruct.create('div', {}, this.inputQueryNode));
    },
    runTask() {
      this.setParam('inputQuery', this.ui.queryQenerator.getQuery());

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

        var dfd = new findSimilarLocationsTask().run({
          portalInfo: this.portalInfo,
          analyzeService: this.analyzeService,
          user: this.user,
          portalUrl: this.portalUrl,
          param: lang.mixin(tempParm, {
            inputLayer: tempParm.inputLayer,
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
            this.onAnalyzeEnd();
          } else {
            alert('失败')
          }

        }), lang.hitch(this, function (res) {
          alert(res);
          this.onAnalyzeEnd();
        }))

      }
    },
    getAvailableLayers() {
      domConstruct.empty(this.layerChooseNode);
      domConstruct.empty(this.layerCompareNode);

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
      }, this.layerCompareNode);

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

          ArrayUtil.forEach(res, function (v) {
            if (arcgisUtil.isPointLayer(v.info.geometryType)) {
              domConstruct.create('option', {
                value: v.url,
                innerHTML: v.name
              }, this.layerCompareNode);
            }
          }, this);

        }));

    },
    searchLayerChange(evt) {
      var layerUrl = evt.target.value;
      this.setParam('searchLayer', layerUrl);
      this.data.searchLayer = ArrayUtil.filter(this.data.availableServices, function (v) {
        return v.url === layerUrl;
      }, this)[0];

      this.checkIfNeed2FindSimilarRule();
    },
    inputLayerChange(evt) {
      var layerUrl = evt.target.value;
      this.data.inputLayer = ArrayUtil.filter(this.data.availableServices, function (v) {
        return v.url === layerUrl;
      }, this)[0];

      this.setParam('inputLayer', layerUrl);

      this.checkIfNeed2FindSimilarRule();
      this.renderInputQueryNode(this.data.inputLayer.info.fields);

    },

    renderInputQueryNode(fields) {
      this.setParam('inputQuery', null);
      this
        .ui
        .queryQenerator
        .setFields(fields);
    },

    renderSimilarRuleNodes(fileds) {
      this.data.similarFields = {};
      domConstruct.empty(this.similarRuleNodes);
      if (fileds.length > 0) {
        ArrayUtil
          .forEach(fileds, function (v) {
            var template = '<label><input  type="checkbox" >' + v.alias + '</label>';
            var li = domConstruct.create('li', {
              innerHTML: template
            }, this.similarRuleNodes);

            on(li, touch.press, lang.hitch(this, function (evt) {

              this.data.similarFields[v.name] = !this.data.similarFields[v.name];
              var tmp = [];
              for (var key in this.data.similarFields) {
                if (this.data.similarFields[key]) {
                  tmp.push(key);
                }
              }

              this.setParam('analysisFields', tmp);

            }));
          }, this);

      } else {
        this.similarRuleNodes.innerHTML = '两图层之间没有匹配的字段'
      }

    },

    checkIfNeed2FindSimilarRule() {

      if (this.getParam('searchLayer') && this.getParam('inputLayer')) {
        if (this.data.inputLayer && this.data.searchLayer) {
          //获取重复的字段
          var inputFields = this.data.inputLayer.info.fields;
          var compareFields = this.data.searchLayer.info.fields;
          var resultFields = ArrayUtil.filter(inputFields, function (inputfield) {

            return ArrayUtil.some(compareFields, function (comparefield) {
              return inputfield.name === comparefield.name
            }, this) && arcgisUtil.isNumberFieldType(inputfield.type);

          }, this);

          this.renderSimilarRuleNodes(resultFields);

        } else {
          console.log('bug');
        }

      }

    },

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
          name: '步骤二',
          srcNode: this.step_2_node,
          params: {
            inputQuery: {
              rule: [
                {
                  msg: '不能为空',
                  valid: function (value) {
                    if (that.getParam('inputLayer') == that.getParam('searchLayer')) {
                      return true;
                    } else {
                      if (that.ui.queryQenerator.isValid()) {
                        return true;
                      }
                    }

                  }
                }
              ]
            }
          }
        }, {
          name: '步骤三',
          srcNode: this.step_3_node,
          params: {
            searchLayer: {},
            rule: [
              {
                msg: '不能为空',
                valid: function (value) {
                  return value != null && value != ''
                }
              }
            ]
          }
        }, {
          name: '步骤四',
          srcNode: this.step_4_node,
          params: {
            analysisFields: {
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
          srcNode: this.step_5_node,
          name: '步骤五',
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