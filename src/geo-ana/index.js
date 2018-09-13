define([
  'dojo/dom',
  'dojo/_base/lang',
  'dojo/dom-construct',
  './Pane',
  'dojo/text!./style.css',
  './arcgisUtil'
], function (dom, lang, domConstruct, Pane, css, arcgisUtil) {

  var Widget = function (options) {
    this.options = {};
    lang.mixin(this.options, options);
    //https://map.xyzhgt.com/arcgis/rest/services/test/testPoint/MapServer

    this.user = {
      username: '',
      password: '',
      token: ''
    },

    lang.mixin(this.user, options.user);
    this.portalUrl = options.config
      ? options.config.portalUrl
      : options.portalUrl;
    this.mapView = options.mapView;

    if (window.Onemap && window.Onemap.SystemInfo) {
      this.user.token = window.Onemap.SystemInfo.token || 'kaKGaz3dglAN1wLFRk0AEJbmYb_SY8VvxXgCJfciyISRuqKw-Ue4xxbeRmfAxdyLgSY-EKhCYAHptdwd' +
        'o-bO2yRR_Lic__obJjIXbCNtHdcUeFEpKtxx-wPzipYXT4zDB5H85Peln1_c7jkV1J0MPf0lhLej_0GE' +
          '-mH-zFWLrvo.';
      this.user.username = window.Onemap.SystemInfo.user.username||'lilei';
    }

    var srcNodeid = options.config
      ? options.config.srcNodeId
      : options.srcNodeId;

    this.init({srcNodeId: srcNodeid});
  }

  Widget.prototype = {
    ui: {},
    init: function (param) {
      if (!param.srcNodeId) {
        throw new Error('srcNodeId can not be null');
      }

      this.loadCss();
      var contanierId = param.srcNodeId;
      //清空div中所有内容
      domConstruct.empty(contanierId);

      arcgisUtil
        .getUserInfo({portalUrl: this.portalUrl, token: this.user.token, username: this.user.username})
        .then(lang.hitch(this, function (userInfo) {
          this.user.info = userInfo;
          //获取portal元数据
          arcgisUtil
            .getPortalInfo({portalUrl: this.portalUrl, token: this.user.token})
            .then(lang.hitch(this, function (res) {
              //初始化空间分析面板
              this.ui.pane = new Pane(lang.mixin(this.options, {
                user: this.user,
                portalUrl: this.portalUrl
              }, {
                portalInfo: res
              }, {mapView: this.mapView}), domConstruct.create('div', {}, contanierId));
              this
                .ui
                .pane
                .startup()

            }))

        }), lang.hitch(this, function (err) {
          throw new Error('获取用户信息失败：' + err);
        }));

    },
    loadCss: function () {

      var dom = document.createElement('style');
      dom.innerHTML = css;
      document
        .head
        .append(dom)
    }
  }

  return Widget;
})