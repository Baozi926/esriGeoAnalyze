/**
 * @author caihm
 * @createDate 2018-9-3
 *
*/

define([
  'dojo/on',
  'dojo/touch',
  "esri/layers/FeatureLayer",
  'dojo/_base/array',
  'dojo/promise/all',
  'dojo/dom-construct',
  'dojo/_base/lang',
  'dojo/dom-class',
  'dojo/dom-style',

  'esri/request',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/_base/declare',

  'dojo/string',
  '../query-generator/query-generator'

], function (on, touch, FeatureLayer, ArrayUtil, all, domConstruct, lang, domClass, domStyle, esriRequest, _WidgetBase, _TemplatedMixin, declare, string, QueryGenerator) {
  var widget = declare([
    _WidgetBase, _TemplatedMixin
  ], {
    templateString: '<li class="equation"></li>',
    constructor(options) {
      this.config = options.config;
    },
    config: {},
    postCreate() {
      var operatorNode = domConstruct.create('a', {
        className: 'click-enable',
        innerHTML: '和',
        onclick: lang.hitch(this, function () {
          if (this.config.relation.operator === 'and') {
            operatorNode.innerHTML = '或者';
            this.config.relation.operator = 'or'
          } else {
            operatorNode.innerHTML = '和';
            this.config.relation.operator = 'and'
          }

        })
      }, this.domNode);
      domConstruct.create('span', {
        className: 'expression-text',
        innerHTML: this.config.text
      }, this.domNode);
      var deleteBtn = domConstruct.create('button', {
        innerHTML: '删除',
        className: 'btn delete',
        onclick: lang.hitch(this, function (e) {
          this.destroy();
        })
      }, this.domNode);

      domConstruct.create('div', {
        className: 'c'
      }, this.domNode);

    },
    destroy() {
      this.inherited(arguments);
      this.config = null;

    },

    startup() {}
  });

  return widget;

})