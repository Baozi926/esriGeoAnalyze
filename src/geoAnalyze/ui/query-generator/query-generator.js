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
        this.ui.valueNode.disabled = true;
        this.ui.valueNode.value = ''
      } else {
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
    //获取查询文本描述
    getText() {

      var type = ArrayUtil.filter(this.data.relations, function (v) {
        return v.value === this.queryTemplate
      }, this)[0];

      var value = this.queryValue
      if (isNaN(value)) {
        value = "'" + value + "'";
      }

      var text = this.queryfeild + ' ' + type.name + ' ' + (type.notRequireValue
        ? ''
        : value);
      return text;
    },
    //获取查询的sql语句
    getQuery() {
      var value = this.queryValue;
      if (isNaN(value)) {
        value = "'" + value + "'";
      }

      var query = string.substitute(this.queryTemplate, {
        field: this.queryfeild,
        value: value
      })

      console.log(query);
      return query;
    },

    isValid() {
      //todo
      return true
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

      var input = domConstruct.create('input', {
        className: "mt mbh",
        type: 'text'
      }, this.valueNode);

      this.ui.valueNode = input

      on(input, 'change', lang.hitch(this, function (evt) {

        this.queryValue = evt.target.value;

      }));

    },

    startup() {}
  });

  return widget;

})