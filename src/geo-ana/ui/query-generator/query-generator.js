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
  'dojo/text!./template.html',
  'dojo/string'

], function (on, touch, FeatureLayer, ArrayUtil, all, domConstruct, lang, domClass, domStyle, esriRequest, _WidgetBase, _TemplatedMixin, declare, template, string) {
  var widget = declare([
    _WidgetBase, _TemplatedMixin
  ], {
    constructor(options) {
      console.log('queryGenerator');
    },
    postCreate() {
      this.renderRelation();
    },

    renderRelation() {
      //构造等式关系选择dom
      domConstruct.empty(this.relationNode);

      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.relationNode);

      ArrayUtil.forEach(this.data.relations, function (v) {
        domConstruct.create('option', {
          innerHTML: v.name,
          value: v.value
        }, this.relationNode);

      }, this)
    },

    templateString: template,

    queryTemplate: '',
    queryfeild: '',
    queryValue: '',

    data: {
      fileds: [],
      relations: [
        {
          name: '等于',
          value: '${field}=${value}'
        }, {
          name: '不等于',
          value: '${field}!=${value}'
        }, {
          name: '小于',
          value: '${field}<${value}'
        }, {
          name: '大于',
          value: '${field}>${value}'
        }, {
          name: '为空',
          value: '${field} IS NULL',
          notRequireValue: true
        }, {
          name: '不为空',
          value: '${field} IS NOT NULL',
          notRequireValue: true
        }
      ]
    },
    ui: {
      valueNode: null
    },

    relationChange(evt) {
      this.queryTemplate = evt.target.value;
      var tmp = ArrayUtil.filter(this.data.relations, function (v) {
        return v.value === this.queryTemplate
      }, this);

      //如果不需要queryValue 如 不为空的情况，就将queryValue设为1
      if (tmp[0].notRequireValue) {
        this.queryValue = 1;
        this.ui.valueNode.disabled = true
      }else{
        this.ui.valueNode.disabled = false
      }

    },

    fieldChange(evt) {
      this.queryfeild = evt.target.value;
    },

    setFields(fields) {
      this.data.fields = fields;
      this.render();
    },

    getQuery() {
      var query = string.substitute(this.queryTemplate, {
        field: this.queryfeild,
        value: this.queryValue
      })

      console.log(query);
      return query;
    },

    isvalid() {
      return !isNaN(this.queryValue) && this.queryfeild && this.queryTemplate
    },


    render() {
      domConstruct.empty(this.fieldsNode);
      domConstruct.empty(this.valueNode);

      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.fieldsNode);

      ArrayUtil.forEach(this.data.fields, function (v) {
        domConstruct.create('option', {
          innerHTML: v.alias,
          value: v.name
        }, this.fieldsNode);

      }, this);

      var input = domConstruct.create('input', {}, this.valueNode);

      this.ui.valueNode = input

      on(input, 'change', lang.hitch(this, function (evt) {
        if (isNaN(evt.target.value)) {
          this.queryValue = null;
        } else {
          this.queryValue = evt.target.value;
        }

      }));

    },

    startup() {}
  });

  return widget;

})