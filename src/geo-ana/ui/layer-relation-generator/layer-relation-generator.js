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
  'dojo/string',
  '../query-generator/query-generator',
  './equation-item',
  '../num-and-unit'

], function (on, touch, FeatureLayer, ArrayUtil, all, domConstruct, lang, domClass, domStyle, esriRequest, _WidgetBase, _TemplatedMixin, declare, template, string, QueryGenerator, EquationItem, NumAndUnit) {
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

    equationdisplayNode: null,
    relationExtentionNode: null,

    data: {
      equationItems: [],
      fileds: [],
      relations: [
        {
          name: '查询条件（属性查询）',
          value: 'attr'
        }, {
          name: '相交',
          value: 'intersects'
        }, {
          name: '不相交',
          value: 'notIntersects'
        }, {
          name: '某一距离范围内',
          value: 'withinDistance'
        }, {
          name: '某一距离范围外',
          value: 'notWithinDistance'
        }, {
          name: '完全包含',
          value: 'contains'
        }, {
          name: '不完全包含',
          value: 'notContains'
        }, {
          name: '完全位于',
          value: 'within'
        }, {
          name: '不完全位于',
          value: 'notWithin'
        }
      ]
    },
    ui: {
      queryGenerator: null
    },
    param: {
      targetLayer: null,
      selectingLayer: null
    },

    destroyExtraUI() {
      if (this.ui.queryGenerator) {
        this
          .ui
          .queryGenerator
          .destroy();
      }
      if (this.ui.numAndUnit) {
        this
          .ui
          .numAndUnit
          .destroy();
      }
    },

    relationChange(evt) {
      var layerUrl = this.param.targetLayer;
      this.param.relation = evt.target.value;
      domClass.remove(this.searchLayerNode, 'hide');
      domClass.add(this.relationExtentionNode, 'hide');
      this.destroyExtraUI();

      if (this.param.relation === 'withinDistance' || this.param.relation === 'notWithinDistance') {
        domClass.remove(this.relationExtentionNode, 'hide');

        this.ui.numAndUnit = new NumAndUnit({}, domConstruct.create('div', {}, this.relationExtentionNode));

        //todo 距离范围查询ui
      } else if (this.param.relation === 'attr') {

        this.ui.queryGenerator = new QueryGenerator({}, domConstruct.create('div', {}, this.relationExtentionNode));
        var targetLayer = ArrayUtil.filter(this.data.layers, function (v) {
          return layerUrl === v.url
        }, this)[0];

        this
          .ui
          .queryGenerator
          .setFields(targetLayer.info.fields);

        domClass.add(this.searchLayerNode, 'hide');
        domClass.remove(this.relationExtentionNode, 'hide');

      }

    },

    relateLayerChange(evt) {
      this.param.selectingLayer = evt.target.value;
    },
    //将参数格式化成 派生新位置这个gp所需的数据格式
    getQueryParam4deriveNewLocations() {
      var configs = [];
      var allLayers = [];
      var expressions = [];

      ArrayUtil.forEach(this.data.equationItems, function (v) {
        if (v.config) {
          configs.push(v.config)
        }
      }, this);

      ArrayUtil.forEach(configs, function (config) {
        var inputLayer = config.inputLayer;
        var selectingLayer = config.selectingLayer;

        var existsI = ArrayUtil.some(allLayers, function (v) {
          return v === inputLayer
        }, this);

        if (!existsI) {
          allLayers.push(inputLayer)
        }

        var existsS = ArrayUtil.some(allLayers, function (v) {
          return v === selectingLayer
        }, this);

        if (!existsS) {
          allLayers.push(selectingLayer)
        }

      }, this);

      ArrayUtil.forEach(configs, function (config, configIndex) {
        var inputLayerIndex;
        var selectingLayerIndex;

        var inputLayer = config.inputLayer;
        var selectingLayer = config.selectingLayer;

        ArrayUtil.forEach(allLayers, function (v, k) {

          if (v === inputLayer) {
            inputLayerIndex = k;
          }

          if (v === selectingLayer) {
            selectingLayerIndex = k;
          }
        }, this);

        var expression = {
          operator: configIndex === 0
            ? ''
            : config.relation.operator, //如果是第一个不存在and或者or的关系
          layer: inputLayerIndex,
          spatialRel: config.relation.type,
          selectingLayer: selectingLayerIndex,
          where: config.relation.options.where,
          distance: config.relation.options.distance,
          units: config.relation.options.units
        }

        expressions.push(expression);

      }, this);

      var result = {
        inputLayers: ArrayUtil.map(allLayers, function (v) {
          return {url: v}
        }),
        expressions: expressions
      }

      console.log(result);

      return result;
    },

    addEquation() {
      var queryConfig = this.getQueryConfig()

      var li = domConstruct.create('li', {}, this.equationdisplayNode);

      //判断是否已存在
      var exists = ArrayUtil.some(this.data.equationItems, function (item) {
        return item.config && item.config.text === queryConfig.text
      }, this);

      if (!exists) {

        var equationLi = new EquationItem({
          config: queryConfig
        }, li);

        this
          .data
          .equationItems
          .push(equationLi);
      } else {
        alert('条件已存在')
      }

    },
    targetLayerChange(evt) {
      this.param.targetLayer = evt.target.value;
    },

    setLayers(layers) {
      this.data.layers = layers;
      this.render();
    },

    getQueryConfig() {
      var config = {
        text: '',
        inputLayer: this.param.targetLayer,
        selectingLayer: this.param.selectingLayer,
        relation: {
          type: this.param.relation,
          operator: 'and', //or
          options: {
            where: undefined,
            "distance": undefined,
            "units": undefined
          }
        }
      }

      var targetLayer = ArrayUtil.filter(this.data.layers, function (v) {
        return this.param.targetLayer === v.url
      }, this)[0];

      if (config.relation.type === 'attr') {
        config.relation.options.where = this
          .ui
          .queryGenerator
          .getQuery();
        config.text = targetLayer.name + '查询条件：' + this
          .ui
          .queryGenerator
          .getText();
      } else {

        var selectingLayer = ArrayUtil.filter(this.data.layers, function (v) {
          return this.param.selectingLayer === v.url
        }, this)[0];

        var relationName = ArrayUtil.filter(this.data.relations, function (v) {
          return config.relation.type === v.value
        }, this)[0].name;

        if (config.relation.type === 'withinDistance' || config.relation.type === 'notWithinDistance') {
          var numAndUnitValue = this
            .ui
            .numAndUnit
            .getValue();

          config.relation.options.distance = numAndUnitValue.value;
          config.relation.options.units = numAndUnitValue.unit;

          config.text = targetLayer.name + ' ' + relationName + ' ' + this
            .ui
            .numAndUnit
            .getText() + selectingLayer.name;
        } else {
          config.text = targetLayer.name + ' ' + relationName + ' ' + selectingLayer.name;
        }

      }

      console.log(config);
      return config;
    },

    isvalid() {
      return !isNaN(this.queryValue) && this.queryfeild && this.relation
    },

    render() {
      domConstruct.empty(this.targetLayerNode);
      domConstruct.empty(this.searchLayerNode);

      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.targetLayerNode);

      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.searchLayerNode);

      ArrayUtil.forEach(this.data.layers, function (v) {
        domConstruct.create('option', {
          innerHTML: v.name,
          value: v.url
        }, this.targetLayerNode);
      }, this);

      ArrayUtil.forEach(this.data.layers, function (v) {
        domConstruct.create('option', {
          innerHTML: v.name,
          value: v.url
        }, this.searchLayerNode);
      }, this);

    },

    startup() {}
  });

  return widget;

})