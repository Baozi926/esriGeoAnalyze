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
    './extract-data-task',
    '../../arcgisUtil',
    '../ToolBase',
    '../../config'
], function (FeatureLayer, ArrayUtil, all, domConstruct, lang, domClass, domStyle, esriConfig, esriRequest, _WidgetBase, _TemplatedMixin, declare, template, arrayUtil, extractDataTask, arcgisUtil, ToolBase, geoAnaConfig) {
    var widget = declare('caihm.widgets.extract-data', [
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
            this.getAvailableLayer(); //初始化选择图层
            this.initFolders(); //初始化输出位置
            this.useCurrentExtentChange({target: this.useCurrentExtent_Node}); //初始化使用当前extent
        },

        //获取输入信息
        initParams: function () {

            return [
                {
                    srcNode: this.step_1_node, //输入图层
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
                    srcNode: this.step_2_node, //输入区域
                    name: '步骤二',
                    params: {
                        fanwei: {
                            value: "now",
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
                    srcNode: this.step_3_node, //输入数据格式
                    name: '步骤三',
                    params: {
                        geshi: {
                            value: "CSV",
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
                    srcNode: this.step_4_node,
                    name: '步骤四',
                    params: {
                        use_current_extent: {}, //当前范围
                        result_layer_name: { //输出名称
                            rule: [
                                {
                                    msg: '不能为空',
                                    valid: function (value) {
                                        return value != null && value != ''
                                    }
                                }
                            ]
                        },
                        folderId: { //输出位置
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
        },

        //获取当前图层,初始化选择框
        getAvailableLayer() {
            console.log("servicesAll", this.mapView.map.allLayers.items);
            //获取服务
            var services = ArrayUtil.filter(this.mapView.map.allLayers.items, function (v) {
                //排除底图
                var isBaseMap = ArrayUtil.some(this.mapView.map.basemap.baseLayers.items, function (vv) {
                    return vv.id === v.id
                }, this);

                //只针对加载的服务
                if (v.url && !isBaseMap && v.operationalLayerType === "ArcGISFeatureLayer") { //工具只对featurelayer有效
                    if (v.url.indexOf(this.portalInfo.portalHostname) != -1) {
                        return true
                    }
                }
            }, this);
            console.log("services", services);

            if (services.length === 0) {
                 this.onNoServiceAvailable();
            }

            //清空选择图层option
            domConstruct.empty(this.layerChooseNode);
            domConstruct.create('option', {
                selected: true,
                disabled: true,
                hidden: true,
                innerHTML: '请选择'
            }, this.layerChooseNode);

            //清空选择范围图层option
            domConstruct.empty(this.fieldChooseNode);
            domConstruct.create('option', {
                selected: true,
                disabled: true,
                hidden: true,
                innerHTML: '与显示一致'
            }, this.fieldChooseNode);

            //获取图层信息
            var filterServices = []
            var promises = ArrayUtil.map(services, function (v, k) {
                var url;
                if (v.sublayers && v.sublayers.items.length === 1) { //如果只有一层
                    url = v.url + '/0';
                } else {
                    url = v.url
                }
                return arcgisUtil.getLayerInfo(url, this.user.token);
            }, this);
            console.log("promises", promises);

            all(promises).then(lang.hitch(this, function (resArr) {
                this.currentServicesInfo = [];

                console.log("resArr", resArr);

                ArrayUtil.forEach(resArr, function (v, k) {

                    filterServices.push(services[k]);
                    this
                        .currentServicesInfo
                        .push({layer: services[k], info: v});
                    //为过滤后的结果生成option（图层）
                    for (var i = 0; i < v.layers.length; i++) {
                        domConstruct.create('option', {
                            value: services[k].id + "?" + v.layers[i].id,
                            innerHTML: services[k].title + "-" + v.layers[i].name
                        }, this.layerChooseNode)
                    }
                    //为过滤后的结果生成option（范围）
                    domConstruct.create('option', {
                        value: "0",
                        innerHTML: "与显示一致"
                    }, this.fieldChooseNode)
                    for (var i = 0; i < v.layers.length; i++) {
                        domConstruct.create('option', {
                            value: services[k].id + "?" + v.layers[i].id,
                            innerHTML: "与&nbsp;" + services[k].title + "-" + v.layers[i].name + "&nbsp;一致"
                        }, this.fieldChooseNode)
                    }
                }, this);

            }));

        },
        //输出位置初始化
        initFolders() {
            // 清空结果存储位置
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

            ArrayUtil.forEach(this.user.info.folders, function (v) { //创建文件夹信息
                domConstruct.create('option', {
                    value: v.id,
                    innerHTML: v.title
                }, this.resultFolderNode)
            }, this);

        },
        //是否用当前范围
        useCurrentExtentChange: function (evt) {
            this.setParam('use_current_extent', evt.target.checked)
        },

        resultNameChange: function (evt) {
            this.setParam('result_layer_name', evt.target.value)
        }, //输出名称变化
        resultFolderChange: function (evt) {
            this.setParam('folderId', evt.target.value)
        }, //输出文件夹变化
        choosenfanweiChange(evt) {
            console.log(evt);
            if (evt.target.value == "0") {
                //如果是当前范围
                this.setParam('fanwei', this.mapView.extent.toJSON())
            } else {
                var layerId = evt
                    .target
                    .value
                    .split("?")[0];
                var layer = this
                    .mapView
                    .map
                    .findLayerById(layerId);
                var value;

                value = layer.url + "/" + evt
                    .target
                    .value
                    .split("?")[1];
                var layer = new FeatureLayer({url: value});
                layer
                    .queryExtent()
                    .then(function (results) {

                        //console.log(results); 如果是当前范围
                        this.setParam('fanwei', results.extent.toJSON())
                    });
            }
            //如果是某个图层的范围 this.setParam('fanwei', evt.target.value)
        }, //范围变化
        choosengeshiChange(evt) {
            this.setParam('geshi', evt.target.value)
        }, //输出格式变化
        inputLayerChange(evt) {

            var layerId = evt
                .target
                .value
                .split("?")[0];
            var layer = this
                .mapView
                .map
                .findLayerById(layerId);
            var value;

            value = layer.url + "/" + evt
                .target
                .value
                .split("?")[1];

            this.setParam('inputLayer', value) //设置输入图层

        }, //输入图层变化

        //开始计算
        runTask() {
            var state = this.checkParam(); //检查客户填写信息,返回一个valid状态

            if (state.valid) { //如果填写正确
                this.onAnalyzeStart();
                var tempParm = this.getTransParam(); //获取所有输入信息
                var context;

                if (tempParm.use_current_extent) { //如果是使用当前范围,暂存当前范围
                    context = {
                        "extent": {
                            "type": "extent"
                        }
                    }
                    lang.mixin(context.extent, this.mapView.extent.toJSON())
                }

                var dfd = new extractDataTask().run({ //调用task
                    portalInfo: this.portalInfo,
                    analyzeService: this.analyzeService,
                    user: this.user,
                    portalUrl: this.portalUrl,
                    param: {
                        inputLayer: tempParm.inputLayer, //输入图层
                        extent: tempParm.fanwei,
                        clip: "true",
                        dataFormat: tempParm.geshi,
                        context: context,
                        exportService: {
                            name: tempParm.result_layer_name //输出名称
                        },
                        folderId: tempParm.folderId
                    }
                });

                dfd.then(lang.hitch(this, function (res) {
                    if (res.success) {
                        //将结果图层加载到地图
                        var serviceUrl = res.serviceUrl;
                        if (geoAnaConfig.forceHttps) {
                            serviceUrl = arcgisUtil.forceUrlToHttps(serviceUrl);
                        }
                        //console.log('结果图层url:' + serviceUrl;
                        alert('数据提取成功，可在“我的内容”中查看该数据。');
                        // this.mapView.map.add(new FeatureLayer({ url: serviceUrl, token:
                        // this.user.token }));

                    }
                    this.onAnalyzeEnd(res);
                }), lang.hitch(this, function (err) {
                    this.onAnalyzeEnd();
                    alert(err);

                }))
            }
        }
    });

    return widget;

})