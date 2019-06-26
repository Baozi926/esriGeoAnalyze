define([
  "esri/layers/FeatureLayer",

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
  'dojo/text!./task-item.html',
  'dojo/_base/array',
  '../arcgisUtil'
], function (FeatureLayer, ArrayUtil, domConstruct, lang, domClass, domStyle, esriConfig, esriRequest, _WidgetBase, _TemplatedMixin, declare, template, arrayUtil, arcgisUtil) {
  var widget = declare([
    _WidgetBase, _TemplatedMixin
  ], {
    templateString: template,
    constructor(options) {
      this.taskInfo = options.taskInfo;
      this.taskId = this.taskInfo.taskId;
      this.detailNode = options.detailNode;

    },
    hideDetail() {
      domClass.remove(this.detailNode, 'show');
      domConstruct.empty(this.detailNode);
    },
    showDetail() {
      if (this.detailCnt) {
        this.hideDetail();
      }
      domClass.add(this.detailNode, 'show');
      var html = this.taskInfo.html;
      //防止id重复
      html.id = arcgisUtil.uuid();
      console.log(html);

      var cnt = domConstruct.create('div', {}, this.detailNode);
      this.detailCnt = cnt;

      var closeButton = domConstruct.create('button', {
        innerHTML: '关闭',
        className: 'btn close',
        onclick: lang.hitch(this, function () {
          this.hideDetail()
        })
      }, cnt);

      domConstruct.place(html, cnt)

    },
    postCreate() {
      //运行父类的postCreate函数
      this.inherited(arguments);
      this.nameNode.innerHTML = this.taskInfo.toolName;
    },
    deleteItem() {
      this
        .parent
        .deleteTask(this);
    },
    destroy() {
      this.inherited(arguments);
      this.taskInfo = null;
     
      this.hideDetail();
    },
    setFinished() {
      domClass.remove(this.taskStateNode, 'running');
      domClass.add(this.taskStateNode, 'finished');
      this.taskStateNode.innerHTML = '已完成';
      this.isFinished = true;
      domClass.add(this.domNode, 'finished');
    },
    setFailed(info){
      domClass.remove(this.taskStateNode, 'running');
      domClass.add(this.taskStateNode, 'failed');
      this.taskStateNode.innerHTML = '执行失败';
      this.isFinished = true;
      domClass.add(this.domNode, 'failed');
    },
    startup() {}
  });

  return widget;

})