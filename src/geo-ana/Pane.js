define([
  './config',
  'dojo/_base/declare',
  'dojo/dom-construct',
  'dojo/dom',
  'dojo/_base/lang',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/text!./template.html',
  'dojo/_base/array',
  'dojo/dom-class',
  'dojo/on',
  'dojo/touch'
], function (config, declare, domConstruct, dom, lang, _WidgetBase, _TemplatedMixin, templateString, ArrayUtil, domClass, on, touch) {


  var REQUIRE_URL_PERFIX = 'src/geo-ana/'
  var clazz = declare('modules.geoAnalyze.Pane', [
    _WidgetBase, _TemplatedMixin
  ], {
    toolListNode: null, //工具列表的容器
    toolListContainerNode: null, //包含工具列表的容器
    toolContentNode: null, //空间分析组件的容器
    templateString: templateString,
    options: {},
    constructor: function (options, srcNode) {

      lang.mixin(this.options, options);
      this.config = config;
      this.data.tooleList = this.config.toolList;

      if (!this.options.portalInfo.helperServices.analysis) {
        throw new Error('未检测到【空间分析】模块');
      }
      this.analyzeService = this.options.portalInfo.helperServices.analysis.url;
      this.user = options.user;
      this.portalUrl = options.portalUrl;
      this.mapView = options.mapView;

    },
    startup: function () {
      on(this.goBackNode, touch.press, lang.hitch(this, function () {
        this.switchPane('list');
      }));
      this.switchPane('list');
      this.render();

      //每当图层变化时重新加载空间分析组件
      this
        .mapView
        .on('layerview-create', lang.hitch(this, function () {
          if (this.data.currentToolParam) {
            this.reloadTool();
          }
        }));

      this
        .mapView
        .on('layerview-destroy', lang.hitch(this, function () {
          if (this.data.currentToolParam) {
            this.reloadTool();
          }
        }));

    },
    data: {
      activeTool: '',
      tooleList: [],
      ui: {
        currentPane: 'list'
      },
      currentToolParam: undefined
    },

    switchPane: function (param) {
      if (param === 'list') {
        this.data.ui.currentPane = 'list';
        domClass.add(this.toolListContainerNode, 'active');
        domClass.remove(this.toolContentNode, 'active');

        //销毁工具
        if (this.activeTool && lang.isFunction(this.activeTool.destroy)) {
          this
            .activeTool
            .destroy()
        }

      } else {
        domClass.remove(this.toolListContainerNode, 'active');
        domClass.add(this.toolContentNode, 'active');
        this.data.ui.currentPane = 'tool';
      }
    },
    initGeoAnaWidget(param) {
      this.switchPane();
      //清空div
      domConstruct.empty(this.toolSrcNode)
      this.loadTool(param);
      this.data.currentToolParam = param;

    },

    reloadTool() {
      if (this.data.ui.currentPane === 'tool') {
        if (this.activeTool) {
          this
            .activeTool
            .destroy();
        }
        this.loadTool(this.data.currentToolParam);
      }

    },
    loadTool: function (config) {
      var that = this;
      //require url的前缀，根据dojoConfig而定
      var perfix = REQUIRE_URL_PERFIX

      try {
        require([perfix + config.url], function (Widget) {
          if (Widget) {
            console.log('load [' + config.name + ']');
            var widget = new Widget({
              user: that.user,
              portalInfo: that.portalInfo,
              analyzeService: that.analyzeService,
              portalUrl: that.portalUrl,
              mapView: that.mapView

            }, domConstruct.create('div', {}, that.toolSrcNode));
            if (lang.isFunction(widget.startup)) {
              widget.startup();
            }
            that.activeTool = widget;
          }
        });
      } catch (e) {
        console.log('=============error start===============');
        console.log(e);
        console.log('=============error end===============');
      }

    },

    render: function () {
      if (!this.data.activeTool) {
        this.switchPane('list');
        domConstruct.empty(this.toolListNode)
        ArrayUtil.forEach(this.data.tooleList, function (v, k) {
          var rootContainer = domConstruct.create('div', {
            innerHTML: '',
            className: 'category-container c'
          }, this.toolListNode);

          var title = domConstruct.create('div', {
            innerHTML: v.name,
            className: 'tool-category-title c'
          }, rootContainer);
          var container = domConstruct.create('div', {
            innerHTML: '',
            className: 'item-list'
          }, rootContainer);
          ArrayUtil.forEach(v.children, function (vv) {
            var dom = domConstruct.create('a', {
              innerHTML: '<img class="pic" src="' + vv.pic + '" ></img><span class="name">' + vv.name + '</span>',
              className: 'tool-item cell service-item ' + (vv.icon || '')
            }, container);

            on(dom, touch.press, lang.hitch(this, function (evt) {
              this.initGeoAnaWidget(vv);
            }))

          }, this);

        }, this);
      }
    },
    postCreate() {}
  })

  return clazz;
})