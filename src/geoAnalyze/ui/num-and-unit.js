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
  '../arcgisUtil'

], function (on, touch, FeatureLayer, ArrayUtil, all, domConstruct, lang, domClass, domStyle, esriRequest, _WidgetBase, _TemplatedMixin, declare, string, arcgisUtil) {
  var widget = declare([
    _WidgetBase, _TemplatedMixin
  ], {
    constructor(options) {},
    valueNode: null,
    unitNode: null,
    postCreate() {
      this.valueNode = domConstruct.create('input', {
        className: 'mt',
        type: 'text'
      }, this.domNode);

      this.unitNode = domConstruct.create('select', {
        className: 'mt'
      }, this.domNode);
      ArrayUtil.forEach(arcgisUtil.numberUnits, function (v) {
        domConstruct.create('option', {
          value: v.value,
          innerHTML: v.name
        }, this.unitNode)

      }, this);

    },

    getValue() {
      return {
        value: parseFloat(this.valueNode.value),
        unit: this.unitNode.value
      }
    },

    getText() {
      if (!this.unitNode.value || !this.valueNode.value) {
        return '';
      }

      var unit = ArrayUtil.filter(arcgisUtil.numberUnits, function (v) {
        return v.value === this.unitNode.value
      }, this)[0];

      return this.valueNode.value + ' ' + unit.name + ' '
    },

    templateString: '<div class="num-and-unit"></div>',

    startup() {}
  });

  return widget;

})