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
  'dojo/text!./task-console.html',
  'dojo/_base/array',
  '../arcgisUtil'
], function (FeatureLayer, ArrayUtil, domConstruct, lang, domClass, domStyle, esriConfig, esriRequest, _WidgetBase, _TemplatedMixin, declare, template, arrayUtil, arcgisUtil) {
  var widget = declare([
    _WidgetBase, _TemplatedMixin
  ], {
    templateString: template,
    constructor(options) {
      this.parent = options.parent;
      this.isTaskItemListShow = true;
    },
    hideConsole() {
      // debugger
      domClass.add(this.parent.domNode, 'hide');
      domClass.add(this.domNode, 'hide');
      this.parent.hideTaskItemList();
      this.isTaskItemListShow = false;
    },
    show(){
      domClass.remove(this.parent.domNode, 'hide');
      domClass.remove(this.domNode, 'hide');
      this.parent.showTaskItemList();
    },
    setState(param) {
      this.finishNumNode.innerHTML = param.finished;
      this.runningNumNode.innerHTML = param.running
    },
    toggleTaskItemList() {
      if (this.isTaskItemListShow) {
        this
          .parent
          .hideTaskItemList()
        this.isTaskItemListShow = false;
      } else {
        this
          .parent
          .showTaskItemList();
        this.isTaskItemListShow = true;
      }

    },
    postCreate() {
      this.hideConsole()
    },
    startup() {}
  });

  return widget;

})