define([
  'esri/config',
  'dojo/dom',
  'dojo/_base/lang',
  'dojo/dom-construct',
  './Pane',
  'dojo/text!./style.css',
  './arcgisUtil',
  './task-monitor/task-monitor',
  'dojo/topic'
], function(
  esriConfig,
  dom,
  lang,
  domConstruct,
  Pane,
  css,
  arcgisUtil,
  TaskMonitor,
  topic
) {
  //关闭esriRequest的用户登录验证 esriConfig.request.useIdentity = false;

  var Widget = function(options) {
    this.options = {};
    lang.mixin(this.options, options);
    //https://map.xyzhgt.com/arcgis/rest/services/test/testPoint/MapServer

    //二三维切换时更新mapView
    topic.subscribe(
      'map-type-change',
      function(view) {
        this.mapView = view;
        if(this.ui&&this.ui.pane){
          this.ui.pane.setMapView(view);
        }
          
      }.bind(this)
    );
    (this.user = {
      username: '',
      password: '',
      token: ''
    }),
      lang.mixin(this.user, options.user);
    if (window.Config && window.Config.portalUrl) {
      this.portalUrl = window.Config.portalUrl;
    } else {
      this.portalUrl = options.config
        ? options.config.portalUrl
        : options.portalUrl;
    }
    this.mapView = options.mapView;

    if (window.Onemap && window.Onemap.SystemInfo) {
      this.user.token = window.Onemap.SystemInfo.token;
      this.user.username = window.Onemap.SystemInfo.user.username;
    }
    if (window.Cjw && window.Cjw.SystemInfo) {
      this.user.token = window.Cjw.SystemInfo.token;
      this.user.username = window.Cjw.SystemInfo.user.username;
    }

    var srcNodeId = options.config
      ? options.config.srcNodeId
      : options.srcNodeId;

    //触发空间分析的按钮
    var toggleButtonId = options.config
      ? options.config.toggleButtonId
      : options.toggleButtonId;
    this.srcNodeId = srcNodeId;

    this.init({ srcNodeId: srcNodeId, toggleButtonId: toggleButtonId });
  };

  Widget.prototype = {
    ui: {},
    onNoAuth() {
      var trigger = window.document.getElementById('geoAna-button');
      if(trigger){
        trigger.style.display = 'none'
      }
      domConstruct.empty(this.srcNodeId);
      var loginUrl =
        window.location.origin +
        '/geoplat/signin.html?redirectUrl=' +
        window.location.href;
      domConstruct.create(
        'div',
        {
          innerHTML:
            '<div class="text" >只有登录，且level 2级别的用户才具有空间分析的权限</div><a class="btn spatial-login' +
            '" href="' +
            loginUrl +
            '"><i class="icon fa-user-circle"></i><span class="txt">登录</span></a>',
          className: 'spatial-no-auth-warning'
        },
        this.srcNodeId
      );
    },
    init: function(param) {
      if (!param.srcNodeId) {
        throw new Error('srcNodeId can not be null');
      }
      this.loadCss();
      //若用户未登录则不启动空间分析插件
      if (!this.user.username) {
        // domConstruct.destroy(param.toggleButtonId);
        // dom.byId('geoAna-button')

        this.onNoAuth();

        return;
      }

      var contanierId = param.srcNodeId;
      //清空div中所有内容
      domConstruct.empty(contanierId);

      arcgisUtil
        .getUserInfo({
          portalUrl: this.portalUrl,
          token: this.user.token,
          username: this.user.username
        })
        .then(
          lang.hitch(this, function(userInfo) {
            this.user.info = userInfo;
            //获取portal元数据
            arcgisUtil
              .getPortalInfo({
                portalUrl: this.portalUrl,
                token: this.user.token
              })
              .then(
                lang.hitch(this, function(res) {
                  //拥有level2权限的用户才能进行空间分析
                  if (res.user && res.user.level === '2') {
                    //初始化空间分析面板
                    this.ui.pane = new Pane(
                      lang.mixin(
                        this.options,
                        {
                          user: this.user,
                          portalUrl: this.portalUrl
                        },
                        {
                          portalInfo: res
                        },
                        { mapView: this.mapView }
                      ),
                      domConstruct.create('div', {}, contanierId)
                    );
                    this.ui.pane.startup();

                    this.ui.taskMonitor = TaskMonitor.getInstance();
                    this.ui.taskMonitor.setMapView(this.mapView);
                  } else {
                   this.onNoAuth()
                    return;
                  }
                })
              );
          }),
          lang.hitch(this, function(err) {
            throw new Error('获取用户信息失败：' + err);
          })
        );
    },
    loadCss: function() {
      var dom = document.createElement('style');
      dom.innerHTML = css;
      document.head.append(dom);
    }
  };

  return Widget;
});
