define([
  'esri/layers/FeatureLayer',
  'dojo/_base/array',
  'dojo/on',
  'dojo/promise/all',
  'dojo/dom-construct',
  'dojo/_base/lang',
  'dojo/dom-class',
  'dojo/dom-style',
  'esri/config',
  'esri/request',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/_base/declare',
  'dojo/text!./template.html',
  'dojo/_base/array',
  './up-down-stream-tracing-task',
  '../../arcgisUtil',
//   '../ToolBase',
  '../../config'
], function(
  FeatureLayer,
  ArrayUtil,
  on,
  all,
  domConstruct,
  lang,
  domClass,
  domStyle,
  esriConfig,
  esriRequest,
  _WidgetBase,
  _TemplatedMixin,
  declare,
  template,
  arrayUtil,
  upDownStreamTracingTask,
  arcgisUtil,
//   ToolBase,
  geoAnaConfig
) {
  var widget = declare(
    'caihm.widgets.summarize-within',
    [_WidgetBase, _TemplatedMixin],
    {
      templateString: template
    }
  );

  return widget;
});
